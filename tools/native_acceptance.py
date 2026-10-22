"""Jason Stys: genuine managed PX4 acceptance through the real authenticated ASGI service.

Functions/variables/lines: docs/SOURCE_MAP.md. No mocked transport or fabricated pass record;
missing build, native errors, unsafe observations or assertion failures exit nonzero.
"""

import asyncio
import json
import math
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from console.api import create_app  # noqa: E402
from console.auth import add_user  # noqa: E402
from console.px4 import PX4_COMMIT, ManagedPx4  # noqa: E402
from console.store import Store  # noqa: E402

ORIGIN = "http://127.0.0.1:8840"


async def wait_state(client, predicate, seconds=90):
    """Wait a bounded wall-clock interval for genuine observations; print state on timeout."""
    deadline = time.monotonic() + seconds
    last = None
    while time.monotonic() < deadline:
        fleet = (await client.get("/api/fleet")).json()
        last = fleet["aircraft"][0]
        if predicate(last):
            return last
        await asyncio.sleep(0.5)
    raise AssertionError(f"Native condition not reached: {last}")


async def main():
    """Assert actual position, upload, mission, hold, return, wrong-target and stale-link behavior."""
    database = Path(".runtime/native-acceptance.db")
    if database.exists():
        raise RuntimeError(
            "Use a fresh runtime workspace; do not overwrite prior acceptance evidence"
        )
    store = Store(f"sqlite:///{database}")
    add_user(store, "native-pilot", "synthetic-native-test-password-42", "operator")
    adapter = ManagedPx4()
    app = create_app(store, adapter, ORIGIN)
    records = []
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app),
            base_url=ORIGIN,
            headers={"Origin": ORIGIN},
            timeout=30,
        ) as client:
            response = await client.post(
                "/api/login",
                json={"username": "native-pilot", "password": "synthetic-native-test-password-42"},
            )
            response.raise_for_status()
            client.headers["X-CSRF-Token"] = response.json()["csrf"]
            ready = await wait_state(
                client, lambda row: row["sample"] is not None and not row["blockers"]
            )
            assert math.hypot(ready["sample"]["east_m"], ready["sample"]["north_m"]) < 10
            assert ready["sample"]["battery_pct"] >= 25
            records.append({"check": "real native observations", "sample": ready["sample"]})
            revision = ready["revision"]
            approval = await client.post(
                "/api/aircraft/px4-sih/approve",
                json={
                    "revision": revision,
                    "checks": {
                        key: True
                        for key in ("airspace", "area_clear", "battery", "link", "simulation")
                    },
                },
            )
            approval.raise_for_status()

            async def send(action, key):
                result = await client.post(
                    "/api/aircraft/px4-sih/commands",
                    json={"aircraft_id": "px4-sih", "revision": revision, "action": action},
                    headers={"Idempotency-Key": key},
                )
                result.raise_for_status()
                value = result.json()
                assert value["status"] == "accepted", value
                records.append(
                    {"check": action, "command_id": value["id"], "status": value["status"]}
                )
                return value

            upload = await send("upload", "native-upload-001")
            duplicate = await send("upload", "native-upload-001")
            assert upload["id"] == duplicate["id"]
            wrong = await client.post(
                "/api/aircraft/px4-sih/commands",
                json={"aircraft_id": "atlas", "revision": revision, "action": "start"},
                headers={"Idempotency-Key": "native-wrong-target"},
            )
            assert wrong.status_code == 409
            records.append(
                {"check": "exact-target and duplicate guards", "wrong_target_status": 409}
            )
            await send("start", "native-start-001")
            airborne = await wait_state(
                client,
                lambda row: (
                    row["sample"] is not None
                    and row["sample"]["armed"]
                    and row["sample"]["altitude_m"] > 3
                ),
                60,
            )
            assert math.hypot(airborne["sample"]["east_m"], airborne["sample"]["north_m"]) < 150
            records.append({"check": "observed takeoff", "sample": airborne["sample"]})
            await send("hold", "native-hold-001")
            held = await wait_state(
                client,
                lambda row: row["sample"] is not None and row["sample"]["mode"] == "HOLD",
                20,
            )
            records.append({"check": "observed hold", "sample": held["sample"]})
            await send("return", "native-return-001")
            grounded = await wait_state(
                client,
                lambda row: (
                    row["sample"] is not None
                    and not row["sample"]["armed"]
                    and row["sample"]["altitude_m"] < 2
                ),
                90,
            )
            records.append({"check": "observed return and disarm", "sample": grounded["sample"]})
            adapter.process.terminate()
            await asyncio.to_thread(adapter.process.wait, 10)
            await asyncio.sleep(6)
            stale = await client.post(
                "/api/aircraft/px4-sih/commands",
                json={"aircraft_id": "px4-sih", "revision": revision, "action": "upload"},
                headers={"Idempotency-Key": "native-stale-upload"},
            )
            assert stale.status_code == 409 and "stale" in stale.text
            records.append({"check": "managed process loss blocks command", "status": 409})
            evidence = (await client.get("/api/evidence")).json()
            assert evidence["simulation_only"] and len(evidence["fleet"]["commands"]) == 4
    report = {
        "px4_commit": PX4_COMMIT,
        "binary_sha256": adapter.binary_sha256,
        "mavsdk": "4.0.6",
        "mode": "genuine PX4 SIH, native MAVSDK, actual ASGI service; not mocked",
        "checks": records,
    }
    Path(".runtime/native-evidence.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    print("NATIVE_ACCEPTANCE " + json.dumps(report))
    store.close()


if __name__ == "__main__":
    asyncio.run(main())
