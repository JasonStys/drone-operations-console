"""Jason Stys: native MAVSDK adapter for one app-owned, pinned PX4 SIH process on Linux.

Functions/classes/state variables and lines: docs/SOURCE_MAP.md. No serial, remote-IP,
user-supplied URL, arbitrary binary or real-aircraft endpoint is accepted. A trusted local
OS is required; loopback/source hashes are not hardware identity or malicious-host attestation.
"""

import asyncio
import contextlib
import hashlib
import math
import os
import platform
import shutil
import subprocess
import time
from pathlib import Path

from console.domain import EARTH_M, HOME_LAT, HOME_LON, Plan, Sample, coordinates

PX4_COMMIT = "d6f12ad1c4f70ad3230afd7d86e971421e02fef4"


class ManagedPx4:
    """Own one fixed Linux SIH simulator and its subscriptions; never attach to arbitrary vehicles."""

    name = "PX4 SIH · actual simulated autopilot"
    live = True

    def __init__(self):
        """Initialize resources without launching anything before the app lifespan starts."""
        self.samples: dict[str, Sample] = {}
        self.process = None
        self.sdk = None
        self.tasks = []
        self.values = {}
        self.times = {}
        self.sequence = 0
        self.log = None
        self.binary_sha256 = None

    async def open(self, identifiers: list[str]):
        """Verify source commit, launch only the fixed SIH build, and discover exactly system ID 1."""
        if identifiers != ["px4-sih"] or platform.system() != "Linux":
            raise ValueError(
                "Use a fresh PX4-only workspace on Linux; replay and native fleets cannot mix"
            )
        root = Path(".runtime/px4").resolve()
        git = shutil.which("git")
        if git is None:
            raise ValueError("Reviewed Git installation required for source verification")
        commit = subprocess.check_output(
            [git, "-C", str(root), "rev-parse", "HEAD"], text=True, timeout=10
        ).strip()
        if commit != PX4_COMMIT:
            raise ValueError("PX4 source must match the reviewed commit")
        binary = root / "build/px4_sitl_default/bin/px4"
        with binary.open("rb") as binary_file:
            self.binary_sha256 = hashlib.file_digest(binary_file, "sha256").hexdigest()
        work = root / "build/px4_sitl_default/rootfs"
        work.mkdir(parents=True, exist_ok=True)
        self.log = Path(".runtime/px4-console.log").open("w", encoding="utf-8")
        env = {key: value for key, value in os.environ.items() if not key.startswith("PX4_")}
        env.update(
            PX4_SIM_MODEL="sihsim_quadx",
            PX4_SIMULATOR="sihsim",
            PX4_SYS_AUTOSTART="10040",
            PX4_HOME_LAT=str(HOME_LAT),
            PX4_HOME_LON=str(HOME_LON),
            PX4_HOME_ALT="488",
            PX4_SIM_SPEED_FACTOR="1",
        )
        try:
            self.process = subprocess.Popen(
                [str(binary), "-d"],
                cwd=work,
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=self.log,
                stderr=subprocess.STDOUT,
            )
            from mavsdk import ComponentType, Configuration
            from mavsdk.asyncio import Mavsdk
            from mavsdk.asyncio.plugins.action import ActionAsync
            from mavsdk.asyncio.plugins.mission import MissionAsync
            from mavsdk.asyncio.plugins.telemetry import TelemetryAsync

            self.sdk = Mavsdk(
                Configuration.create_with_component_type(ComponentType.GROUND_STATION)
            )
            await self.sdk.add_any_connection("udpin://127.0.0.1:14540")
            self.system = await self.sdk.first_autopilot(30)
            if (
                self.system is None
                or await self.system.get_system_id() != 1
                or await self.sdk.system_count() != 1
            ):
                raise RuntimeError("Exactly one managed simulated autopilot with ID 1 is required")
            self.telemetry, self.action, self.mission = (
                TelemetryAsync(self.system),
                ActionAsync(self.system),
                MissionAsync(self.system),
            )
            await self.telemetry.set_rate_position(2)
            await self.telemetry.set_rate_velocity_ned(2)
            await self.telemetry.set_rate_battery(1)
            for key in ("position", "battery", "armed", "health", "flight_mode", "velocity_ned"):
                self.tasks.append(asyncio.create_task(self.collect(key)))
        except BaseException:
            await self.close()
            raise

    async def collect(self, key: str):
        """Continuously drain native observations; preserve actual arrival times, not polling time."""
        async for value in getattr(self.telemetry, "subscribe_" + key)():
            self.values[key], self.times[key] = value, time.time()

    async def tick(self):
        """Compose a sample only from received native fields; absent/stale fields remain unknown."""
        if not all(
            key in self.values
            for key in ("position", "battery", "armed", "health", "flight_mode", "velocity_ned")
        ):
            return
        if (
            self.process is None
            or self.process.poll() is not None
            or not await self.system.is_connected()
        ):
            return  # Preserve old arrival time so the safety gate rejects stale state.
        position, velocity, health = (
            self.values["position"],
            self.values["velocity_ned"],
            self.values["health"],
        )
        battery = self.values["battery"].remaining_percent
        # Native MAVSDK 4 reports percentage points (0..100), unlike legacy 3.x fractions.
        if not math.isfinite(battery) or not 0 <= battery <= 100:
            return
        self.sequence += 1
        self.samples["px4-sih"] = Sample(
            sequence=self.sequence,
            received_at=self.times["position"],
            east_m=math.radians(position.longitude_deg - HOME_LON)
            * EARTH_M
            * math.cos(math.radians(HOME_LAT)),
            north_m=math.radians(position.latitude_deg - HOME_LAT) * EARTH_M,
            altitude_m=position.relative_altitude_m,
            battery_pct=battery,
            speed_m_s=math.hypot(velocity.north_m_s, velocity.east_m_s),
            mode=self.values["flight_mode"].name,
            armed=self.values["armed"],
            healthy=health.is_global_position_ok
            and health.is_home_position_ok
            and time.time() - self.times["battery"] <= 10,
        )

    async def execute(self, aircraft: str, action: str, plan: Plan):
        """Apply one fixed action to the owned simulator; all other transport/actions are rejected."""
        if (
            aircraft != "px4-sih"
            or self.process is None
            or self.process.poll() is not None
            or await self.sdk.system_count() != 1
        ):
            raise ValueError("Managed simulator identity is unavailable or ambiguous")
        if action == "upload":
            from mavsdk.plugins.mission import MissionItem, MissionPlan

            items = []
            for point in plan.points:
                latitude, longitude = coordinates(point)
                items.append(
                    MissionItem(
                        latitude,
                        longitude,
                        point.altitude_m,
                        plan.speed_m_s,
                        True,
                        math.nan,
                        math.nan,
                        MissionItem.CameraAction.NONE,
                        math.nan,
                        math.nan,
                        2.0,
                        math.nan,
                        math.nan,
                        MissionItem.VehicleAction.NONE,
                    )
                )
            await self.mission.set_return_to_launch_after_mission(True)
            await self.mission.upload_mission(MissionPlan(items))
        elif action == "start":
            await self.action.arm()
            await self.mission.start_mission()
        elif action == "hold":
            await self.action.hold()
        elif action == "return":
            await self.action.return_to_launch()
        else:
            raise ValueError("Unsupported managed simulator action")

    async def close(self):
        """Cancel subscriptions before destroying native resources; terminate only the owned child."""
        for task in self.tasks:
            task.cancel()
        for task in self.tasks:
            with contextlib.suppress(asyncio.CancelledError):
                await task
        self.tasks.clear()
        if self.sdk is not None:
            self.sdk.destroy()
            self.sdk = None
        if self.process is not None:
            self.process.terminate()
            try:
                await asyncio.to_thread(self.process.wait, 10)
            except subprocess.TimeoutExpired:
                self.process.kill()
                await asyncio.to_thread(self.process.wait, 5)
            self.process = None
        if self.log:
            self.log.close()
            self.log = None
