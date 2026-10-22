"""Jason Stys: exact-target approvals and durable idempotent simulator command dispatch.

Classes/functions/state variables and lines: docs/SOURCE_MAP.md. One service process only;
per-aircraft locks serialize updates. Pending external effects become unknown after restart.
"""

import asyncio
import hashlib
import json
import re
import secrets
import time

from fastapi import HTTPException
from sqlalchemy import insert, select, update

from console.domain import Command, Plan, Preflight, safety_issues
from console.store import commands, vehicles


class Operations:
    """Coordinates trusted adapters with SQL state; adapter errors never imply success."""

    def __init__(self, store, adapter):
        """Allocate bounded per-fleet locks and an actor/key reservation lock."""
        self.store, self.adapter = store, adapter
        self.locks = {row["id"]: asyncio.Lock() for row in store.all_vehicles()}
        self.intents = asyncio.Lock()
        self.boot_id = secrets.token_hex(16)
        store.recover_pending()

    def aircraft(self, identifier: str):
        """Resolve exactly one configured aircraft, rejecting unknown identifiers."""
        vehicle = self.store.vehicle(identifier)
        if vehicle is None:
            raise HTTPException(404, "Unknown aircraft")
        return vehicle

    async def save_plan(self, actor: str, identifier: str, plan: Plan, revision: int):
        """Optimistic plan edit; any change clears previous approval and upload state."""
        self.aircraft(identifier)
        async with self.locks[identifier]:
            sample = self.adapter.samples.get(identifier)
            if sample and sample.armed:
                raise HTTPException(409, "Ground the simulated aircraft before editing its plan")
            with self.store.engine.begin() as db:
                result = db.execute(
                    update(vehicles)
                    .where(vehicles.c.id == identifier, vehicles.c.revision == revision)
                    .values(
                        plan=plan.model_dump_json(),
                        revision=revision + 1,
                        approved_by=None,
                        approved_at=None,
                    )
                )
                if result.rowcount != 1:
                    raise HTTPException(409, "Plan revision changed; reload before editing")
            self.store.event(actor, "plan.saved", identifier, f"revision {revision + 1}")
            return self.aircraft(identifier)

    async def approve(self, actor: str, identifier: str, checks: Preflight, revision: int):
        """Record all five operator attestations against a current plan for ten minutes."""
        self.aircraft(identifier)
        if not all(checks.model_dump().values()):
            raise HTTPException(422, "All five simulation preflight checks are required")
        async with self.locks[identifier]:
            with self.store.engine.begin() as db:
                result = db.execute(
                    update(vehicles)
                    .where(vehicles.c.id == identifier, vehicles.c.revision == revision)
                    .values(approved_by=actor, approved_at=time.time())
                )
                if result.rowcount != 1:
                    raise HTTPException(409, "Approval revision is stale")
            self.store.event(
                actor,
                "preflight.approved",
                identifier,
                f"revision {revision}; all checks attested, not independently certified",
            )
            return self.aircraft(identifier)

    async def command(self, actor: str, identifier: str, key: str, intent: Command):
        """Reserve an exact intent before side effects; never automatically retry unknown effects."""
        self.aircraft(identifier)
        if intent.aircraft_id != identifier:
            raise HTTPException(409, "Selected aircraft and command target differ")
        if not re.fullmatch(r"[a-zA-Z0-9-]{8,80}", key):
            raise HTTPException(422, "An 8–80 character Idempotency-Key is required")
        fingerprint = hashlib.sha256(intent.model_dump_json().encode()).hexdigest()
        # Global reservation prevents cross-aircraft reuse races within this one worker.
        async with self.intents, self.locks[identifier]:
            with self.store.engine.connect() as db:
                previous = (
                    db.execute(
                        select(commands).where(commands.c.actor == actor, commands.c.key == key)
                    )
                    .mappings()
                    .first()
                )
            if previous:
                if previous["fingerprint"] != fingerprint:
                    raise HTTPException(409, "Idempotency key belongs to a different intent")
                return dict(previous)
            vehicle = self.aircraft(identifier)
            if vehicle["revision"] != intent.revision:
                raise HTTPException(409, "Command revision is stale")
            if intent.action in ("upload", "start"):
                if (
                    vehicle["approved_by"] != actor
                    or vehicle["approved_at"] is None
                    or not 0 <= time.time() - vehicle["approved_at"] <= 600
                ):
                    raise HTTPException(
                        409, "Approve this exact plan with your own operator session first"
                    )
            issues = safety_issues(self.adapter.samples.get(identifier), intent.action)
            if issues:
                self.store.event(actor, "command.blocked", identifier, "; ".join(issues))
                raise HTTPException(409, "; ".join(issues))
            if intent.action == "start":
                with self.store.engine.connect() as db:
                    uploads = (
                        db.execute(
                            select(commands)
                            .where(
                                commands.c.aircraft == identifier,
                                commands.c.action == "upload",
                                commands.c.status == "accepted",
                                commands.c.boot_id == self.boot_id,
                                commands.c.revision == intent.revision,
                            )
                            .order_by(commands.c.created_at.desc())
                            .limit(1)
                        )
                        .mappings()
                        .first()
                    )
                if uploads is None:
                    raise HTTPException(409, "Upload this revision before starting")
            record = dict(
                id=secrets.token_hex(16),
                actor=actor,
                key=key,
                fingerprint=fingerprint,
                boot_id=self.boot_id,
                revision=intent.revision,
                aircraft=identifier,
                action=intent.action,
                status="pending",
                message="Intent reserved; effect not yet known",
                created_at=time.time(),
            )
            with self.store.engine.begin() as db:
                db.execute(insert(commands).values(**record))
            try:
                async with asyncio.timeout(20):
                    await self.adapter.execute(
                        identifier, intent.action, Plan.model_validate_json(vehicle["plan"])
                    )
                status, message = (
                    "accepted",
                    f"Uploaded revision {intent.revision}"
                    if intent.action == "upload"
                    else "Autopilot/replay acknowledged; inspect telemetry for outcome",
                )
            except TimeoutError:
                status, message = (
                    "unknown",
                    "Timed out; effect may have occurred. Inspect simulator, do not blindly retry",
                )
            except ValueError:
                # Native errors may include paths/connection details; keep the public result bounded.
                status, message = (
                    "rejected",
                    "Adapter rejected the intent; inspect simulator state before a new request",
                )
            except Exception:
                status, message = (
                    "unknown",
                    "Transport failed; effect may have occurred. Inspect simulator before a new intent",
                )
            with self.store.engine.begin() as db:
                db.execute(
                    update(commands)
                    .where(commands.c.id == record["id"])
                    .values(status=status, message=message)
                )
            self.store.event(actor, f"command.{status}", identifier, f"{intent.action}; {message}")
            return {**record, "status": status, "message": message}

    def snapshot(self):
        """Build a bounded fleet response without exposing session hashes or passwords."""
        result = []
        for vehicle in self.store.all_vehicles():
            sample = self.adapter.samples.get(vehicle["id"])
            result.append(
                {
                    **vehicle,
                    "plan": json.loads(vehicle["plan"]),
                    "sample": sample.model_dump() if sample else None,
                    "blockers": safety_issues(sample, "start"),
                }
            )
        return {
            "mode": self.adapter.name,
            "aircraft": result,
            "commands": self.store.records(commands),
            "generated_at": time.time(),
        }
