"""Jason Stys: strict mission/telemetry contracts and safety policy, without transport I/O.

Functions/classes/variables and exact declaration lines: docs/SOURCE_MAP.md.
Units: meters, meters/second, degrees and Unix seconds. No real-flight authorization.
"""

import math
import time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

HOME_LAT = 47.397742
HOME_LON = 8.545594
EARTH_M = 6_371_000.0
CHECKS = ("airspace", "area_clear", "battery", "link", "simulation")


class Point(BaseModel):
    """One local waypoint; east/north are relative to the fixed simulated launch point."""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    east_m: float = Field(ge=-100, le=100)
    north_m: float = Field(ge=-100, le=100)
    altitude_m: float = Field(ge=5, le=20)


class Plan(BaseModel):
    """Bounded survey plan. Name is display text, never executable or a path."""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    name: str = Field(min_length=1, max_length=60, pattern=r"^[\w .-]+$")
    speed_m_s: float = Field(ge=1, le=5)
    points: list[Point] = Field(min_length=2, max_length=12)

    @model_validator(mode="after")
    def bounded_distance(self):
        """Reject routes above 800 m including departure and return; consume points only."""
        positions = [(0.0, 0.0), *((p.east_m, p.north_m) for p in self.points), (0.0, 0.0)]
        distance = sum(math.dist(a, b) for a, b in zip(positions, positions[1:], strict=False))
        if distance > 800:
            raise ValueError("route including return exceeds the 800 m lab budget")
        return self


class Sample(BaseModel):
    """A received observation; source sequence and arrival freshness are separate concepts."""

    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    sequence: int = Field(ge=0)
    received_at: float = Field(ge=0)
    east_m: float = Field(ge=-10000, le=10000)
    north_m: float = Field(ge=-10000, le=10000)
    altitude_m: float = Field(ge=-1000, le=10000)
    battery_pct: float = Field(ge=0, le=100)
    speed_m_s: float = Field(ge=0, le=200)
    mode: str = Field(min_length=1, max_length=40)
    armed: bool
    healthy: bool


class Preflight(BaseModel):
    """Operator attestations, bound by the server to the selected aircraft and plan revision."""

    model_config = ConfigDict(extra="forbid")
    airspace: bool
    area_clear: bool
    battery: bool
    link: bool
    simulation: bool


class Command(BaseModel):
    """Exact target/revision intent; changing either invalidates an earlier approval."""

    model_config = ConfigDict(extra="forbid")
    aircraft_id: str = Field(pattern=r"^[a-z0-9-]{1,30}$")
    revision: int = Field(ge=1)
    action: Literal["upload", "start", "hold", "return"]


def safety_issues(sample: Sample | None, action: str, now: float | None = None) -> list[str]:
    """Return explicit blockers. Recovery still requires a fresh, usable position/link."""
    now = time.time() if now is None else now
    if sample is None:
        return ["No observation received"]
    issues = []
    if not -1 <= now - sample.received_at <= 5:
        issues.append("Telemetry is stale or future-dated")
    if math.hypot(sample.east_m, sample.north_m) > 200 or not -2 <= sample.altitude_m <= 50:
        issues.append("Position is outside the simulation envelope")
    if action in ("upload", "start"):
        if sample.battery_pct < 25:
            issues.append("Battery below 25% dispatch reserve")
        if not sample.healthy:
            issues.append("Position/home health is not ready")
    if action == "start" and sample.armed:
        issues.append("Already armed; do not automatically restart a mission")
    if action == "upload" and sample.armed:
        issues.append("Ground the simulated aircraft before uploading a mission")
    if action in ("hold", "return") and not sample.armed:
        issues.append("Aircraft is not armed")
    return issues


def coordinates(point: Point) -> tuple[float, float]:
    """Convert a bounded local tangent approximation to lat/lon for this small simulation."""
    return (
        HOME_LAT + math.degrees(point.north_m / EARTH_M),
        HOME_LON + math.degrees(point.east_m / (EARTH_M * math.cos(math.radians(HOME_LAT)))),
    )


def default_plan() -> Plan:
    """Return a new independent 40 m square inspection plan; no real location data."""
    return Plan(
        name="Training perimeter",
        speed_m_s=3,
        points=[
            Point(east_m=e, north_m=n, altitude_m=10)
            for e, n in [(0, 0), (40, 0), (40, 40), (0, 40)]
        ],
    )
