"""Jason Stys: isolated native field conversion regression, not native flight evidence.

Functions/variables/lines: docs/SOURCE_MAP.md. Synthetic SDK-shaped values exercise
normalization only; actual PX4/MAVSDK integration remains an independent CI gate.
"""

import asyncio
import time
from types import SimpleNamespace

import pytest

from console.domain import HOME_LAT, HOME_LON
from console.px4 import ManagedPx4


class ConnectedSystem:
    """Synthetic identity used only to isolate conversion without launching a process."""

    async def is_connected(self):
        """Represent a connected fixture, not a real transport."""
        return True


@pytest.fixture
def native_adapter():
    """Provide synthetic fields with no SDK, socket, binary or real autopilot."""
    adapter = ManagedPx4()
    adapter.process = SimpleNamespace(poll=lambda: None)
    adapter.system = ConnectedSystem()
    adapter.values = {
        "position": SimpleNamespace(
            latitude_deg=HOME_LAT, longitude_deg=HOME_LON, relative_altitude_m=0
        ),
        "battery": SimpleNamespace(remaining_percent=92),
        "armed": False,
        "health": SimpleNamespace(is_global_position_ok=True, is_home_position_ok=True),
        "flight_mode": SimpleNamespace(name="HOLD"),
        "velocity_ned": SimpleNamespace(north_m_s=0, east_m_s=0),
    }
    adapter.times = dict.fromkeys(adapter.values, time.time())
    return adapter


@pytest.mark.parametrize("percentage", [0, 1, 25, 92, 100])
def test_native_v4_preserves_percentage_points(native_adapter, percentage):
    """Native 4.0.6 percentages must neither be rejected above 1 nor multiplied by 100."""
    native_adapter.values["battery"].remaining_percent = percentage
    asyncio.run(native_adapter.tick())
    assert native_adapter.samples["px4-sih"].battery_pct == percentage


@pytest.mark.parametrize("invalid", [-1, 101, float("nan"), float("inf")])
def test_native_invalid_percentage_stays_unknown(native_adapter, invalid):
    """Missing/invalid native percentages cannot create a usable dispatch observation."""
    native_adapter.values["battery"].remaining_percent = invalid
    asyncio.run(native_adapter.tick())
    assert not native_adapter.samples


def test_native_subscription_failure_releases_resources():
    """A failed background collector must surface after all native resources are released."""
    released = []

    async def scenario():
        adapter = ManagedPx4()
        adapter.sdk = SimpleNamespace(destroy=lambda: released.append("sdk"))

        async def fail():
            raise ValueError("synthetic collector fault")

        adapter.tasks.append(asyncio.create_task(fail()))
        await asyncio.sleep(0)
        with pytest.raises(RuntimeError, match="subscription failed"):
            await adapter.close()
        assert not adapter.tasks and adapter.sdk is None

    asyncio.run(scenario())
    assert released == ["sdk"]
