"""Jason Stys: bounded deterministic training replay, not aircraft physics or live telemetry.

Classes/functions/state variables and declaration lines: docs/SOURCE_MAP.md.
Commands change only this in-memory rehearsal; a new process starts grounded.
"""

import asyncio
import math
import time

from console.domain import Plan, Sample


class Replay:
    """Small fleet adapter with the same methods as the separately tested PX4 adapter."""

    name = "REPLAY · synthetic training"

    def __init__(self):
        """Create independent aircraft state and no network sockets."""
        self.states = {}
        self.samples: dict[str, Sample] = {}

    async def open(self, identifiers: list[str]):
        """Initialize only the configured IDs; retain no caller-supplied destination."""
        for identifier in identifiers:
            self.states[identifier] = {
                "mode": "READY",
                "plan": None,
                "index": 0,
                "east": 0.0,
                "north": 0.0,
                "armed": False,
                "sequence": 0,
            }
        await self.tick()

    async def tick(self):
        """Advance a one-second logical animation, labeling low/stale demonstration aircraft."""
        for identifier, state in self.states.items():
            plan = state["plan"]
            if state["mode"] == "MISSION" and plan:
                target = plan.points[state["index"]]
                dx, dy = target.east_m - state["east"], target.north_m - state["north"]
                distance = math.hypot(dx, dy)
                if distance <= plan.speed_m_s:
                    state["east"], state["north"] = target.east_m, target.north_m
                    state["index"] += 1
                    if state["index"] == len(plan.points):
                        state["mode"] = "HOLD"
                else:
                    state["east"] += dx / distance * plan.speed_m_s
                    state["north"] += dy / distance * plan.speed_m_s
            if state["mode"] == "RETURN":
                state.update(east=0.0, north=0.0, armed=False, mode="READY")
            state["sequence"] += 1
            self.samples[identifier] = Sample(
                sequence=state["sequence"],
                received_at=time.time() - (30 if identifier == "relay" else 0),
                east_m=state["east"],
                north_m=state["north"],
                altitude_m=10 if state["armed"] else 0,
                battery_pct=18 if identifier == "ember" else 92,
                speed_m_s=plan.speed_m_s if plan and state["mode"] == "MISSION" else 0,
                mode=state["mode"],
                armed=state["armed"],
                healthy=True,
            )

    async def execute(self, aircraft: str, action: str, plan: Plan):
        """Apply one approved lab intent. Unknown IDs/actions fail instead of redirecting."""
        state = self.states[aircraft]
        if action == "upload":
            state.update(plan=plan, index=0)
        elif action == "start":
            state.update(armed=True, mode="MISSION", index=0)
        elif action == "hold":
            state["mode"] = "HOLD"
        elif action == "return":
            state["mode"] = "RETURN"
        else:
            raise ValueError("unsupported action")
        await self.tick()
        return "Rehearsal accepted; synthetic state only"

    async def close(self):
        """No external process or network resource exists in this adapter."""
        await asyncio.sleep(0)
