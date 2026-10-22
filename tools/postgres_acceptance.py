"""Jason Stys: independent native PostgreSQL persistence, JSON and unique-intent assertions.

Functions/variables and lines: docs/SOURCE_MAP.md. Uses only the explicit disposable CI database;
never drops tables or overwrites another database. No provider account or customer data is used.
"""

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from console.domain import CHECKS, Command, Preflight  # noqa: E402
from console.replay import Replay  # noqa: E402
from console.service import Operations  # noqa: E402
from console.store import Store, commands  # noqa: E402


async def main():
    """Prove concurrent duplicates cause one effect in actual PostgreSQL, then reopen evidence."""
    url = os.environ["OPS_TEST_POSTGRES"]
    if not url.startswith("postgresql+psycopg://") or "127.0.0.1" not in url:
        raise ValueError("Explicit disposable loopback PostgreSQL required")
    store = Store(url)
    store.seed()
    adapter = Replay()
    await adapter.open([row["id"] for row in store.all_vehicles()])
    operations = Operations(store, adapter)
    await operations.approve("ci-pilot", "atlas", Preflight(**dict.fromkeys(CHECKS, True)), 1)
    intent = Command(aircraft_id="atlas", revision=1, action="upload")
    rows = await asyncio.gather(
        *(operations.command("ci-pilot", "atlas", "postgres-duplicate", intent) for _ in range(20))
    )
    assert len({row["id"] for row in rows}) == 1
    assert all(row["status"] == "accepted" for row in rows)
    with store.engine.connect() as db:
        assert len(db.execute(select(commands)).all()) == 1
    store.close()
    reopened = Store(url)
    assert reopened.records(commands)[0]["status"] == "accepted"
    assert reopened.vehicle("atlas")["approved_by"] == "ci-pilot"
    reopened.close()
    print(
        "POSTGRES_ACCEPTANCE: 20 duplicate requests, exactly one accepted intent, durable reopen verified"
    )


if __name__ == "__main__":
    asyncio.run(main())
