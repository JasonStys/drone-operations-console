"""Jason Stys: independent units, bounds, freshness and safety oracles.

Tests/fixture variables and line locations: docs/SOURCE_MAP.md.
"""

import math

import pytest
from pydantic import ValidationError

from console.domain import (
    HOME_LAT,
    HOME_LON,
    Plan,
    Point,
    Sample,
    coordinates,
    default_plan,
    safety_issues,
)


def sample(**changes):
    """Return a fresh synthetic grounded observation; keyword overrides isolate one edge."""
    return Sample(
        **{
            **dict(
                sequence=1,
                received_at=100,
                east_m=0,
                north_m=0,
                altitude_m=0,
                battery_pct=90,
                speed_m_s=0,
                mode="READY",
                armed=False,
                healthy=True,
            ),
            **changes,
        }
    )


@pytest.mark.parametrize(
    "changes",
    [
        {"east_m": 101},
        {"north_m": -101},
        {"altitude_m": 4},
        {"altitude_m": 21},
        {"east_m": math.nan},
        {"north_m": math.inf},
        {"unexpected": 1},
    ],
)
def test_point_rejects_unsafe_values(changes):
    """No out-of-envelope/nonfinite/unknown waypoint value can reach a native adapter."""
    with pytest.raises(ValidationError):
        Point(**{**dict(east_m=0, north_m=0, altitude_m=10), **changes})


@pytest.mark.parametrize(
    "changes",
    [
        {"speed_m_s": 0},
        {"speed_m_s": 6},
        {"name": "<script>"},
        {"points": []},
        {"points": [dict(east_m=0, north_m=0, altitude_m=10)] * 13},
        {
            "points": [
                dict(east_m=100 * (-1) ** i, north_m=100 * (-1) ** i, altitude_m=10)
                for i in range(6)
            ]
        },
    ],
)
def test_plan_bounds(changes):
    """Count, name, speed and total distance constraints are independent of UI validation."""
    with pytest.raises(ValidationError):
        Plan(**{**default_plan().model_dump(), **changes})


def test_coordinate_units():
    """Independent equatorial-scale bounds catch swapped east/north and degrees/meters."""
    assert coordinates(Point(east_m=0, north_m=0, altitude_m=10)) == (HOME_LAT, HOME_LON)
    north = coordinates(Point(east_m=0, north_m=100, altitude_m=10))
    east = coordinates(Point(east_m=100, north_m=0, altitude_m=10))
    assert 0.00089 < north[0] - HOME_LAT < 0.00091
    assert north[1] == HOME_LON
    assert 0.0013 < east[1] - HOME_LON < 0.0014
    assert east[0] == HOME_LAT


@pytest.mark.parametrize(
    "changes,action,blocked",
    [
        ({}, "start", False),
        ({"received_at": 94}, "start", True),
        ({"received_at": 102}, "start", True),
        ({"east_m": 201}, "start", True),
        ({"altitude_m": 51}, "start", True),
        ({"battery_pct": 24.9}, "start", True),
        ({"healthy": False}, "start", True),
        ({"armed": True}, "start", True),
        ({"armed": False}, "return", True),
        ({"armed": True, "battery_pct": 1}, "return", False),
        ({"battery_pct": 25}, "upload", False),
        ({"received_at": 95}, "upload", False),
    ],
)
def test_safety_edges(changes, action, blocked):
    """Five-second freshness and 25% reserve thresholds include their exact boundaries."""
    assert bool(safety_issues(sample(**changes), action, now=100)) is blocked
    assert safety_issues(None, action, now=100) == ["No observation received"]


def test_plans_are_independent():
    """Editing a draft cannot modify the next default plan by aliasing a shared list."""
    one = default_plan()
    one.points.clear()
    assert len(default_plan().points) == 4
