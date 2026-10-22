"""Jason Stys: transactional SQL state, private credential/session hashes and bounded evidence.

Classes/functions/variables and exact lines: docs/SOURCE_MAP.md. SQLAlchemy binds all values.
SQLite is the local lab store; PostgreSQL is independently exercised in CI.
"""

import hashlib
import json
import secrets
import time

from sqlalchemy import (
    Column,
    Float,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    delete,
    insert,
    select,
    update,
)

from console.domain import Sample, default_plan

metadata = MetaData()
users = Table(
    "users",
    metadata,
    Column("name", String(40), primary_key=True),
    Column("password_hash", Text, nullable=False),
    Column("role", String(16), nullable=False),
)
sessions = Table(
    "sessions",
    metadata,
    Column("digest", String(64), primary_key=True),
    Column("user", String(40), nullable=False),
    Column("csrf", String(64), nullable=False),
    Column("expires", Float, nullable=False),
)
vehicles = Table(
    "vehicles",
    metadata,
    Column("id", String(30), primary_key=True),
    Column("name", String(40), nullable=False),
    Column("plan", Text, nullable=False),
    Column("revision", Integer, nullable=False),
    Column("approved_by", String(40)),
    Column("approved_at", Float),
)
commands = Table(
    "commands",
    metadata,
    Column("id", String(32), primary_key=True),
    Column("actor", String(40), nullable=False),
    Column("key", String(80), nullable=False),
    Column("fingerprint", String(64), nullable=False),
    Column("boot_id", String(32), nullable=False),
    Column("revision", Integer, nullable=False),
    Column("aircraft", String(30), nullable=False),
    Column("action", String(16), nullable=False),
    Column("status", String(16), nullable=False),
    Column("message", String(200), nullable=False),
    Column("created_at", Float, nullable=False),
)
Index("command_actor_key", commands.c.actor, commands.c.key, unique=True)
audit = Table(
    "audit",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("at", Float, nullable=False),
    Column("actor", String(40), nullable=False),
    Column("event", String(40), nullable=False),
    Column("aircraft", String(30), nullable=False),
    Column("detail", Text, nullable=False),
)
observations = Table(
    "observations",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("aircraft", String(30), nullable=False),
    Column("sample", Text, nullable=False),
)


class Store:
    """A single service instance's SQL store; URL is trusted deployment configuration, never UI input."""

    def __init__(self, url: str):
        """Open the configured database with bounded SQLite locking; create version-one schema."""
        self.engine = create_engine(
            url,
            connect_args={"check_same_thread": False, "timeout": 15}
            if url.startswith("sqlite")
            else {},
            pool_pre_ping=True,
        )
        metadata.create_all(self.engine)

    def recover_pending(self):
        """Only service startup recovers abandoned intents; provisioning never mutates live commands."""
        with self.engine.begin() as db:
            # A crash after an external side effect cannot be retried safely.
            db.execute(
                update(commands)
                .where(commands.c.status == "pending")
                .values(
                    status="unknown",
                    message="Service restarted; inspect simulator before a new intent",
                )
            )

    def seed(self, live: bool = False):
        """Insert only missing fictional aircraft; preserve saved missions and approvals."""
        names = (
            [("px4-sih", "PX4 · SIH quadrotor")]
            if live
            else [
                ("atlas", "Atlas · survey quad"),
                ("ember", "Ember · response quad"),
                ("relay", "Relay · link trainer"),
            ]
        )
        with self.engine.begin() as db:
            for identifier, name in names:
                if (
                    db.execute(select(vehicles.c.id).where(vehicles.c.id == identifier)).first()
                    is None
                ):
                    db.execute(
                        insert(vehicles).values(
                            id=identifier,
                            name=name,
                            plan=default_plan().model_dump_json(),
                            revision=1,
                        )
                    )

    def vehicle(self, identifier: str):
        """Read one exact aircraft; unknown IDs never fall back to a different vehicle."""
        with self.engine.connect() as db:
            row = db.execute(select(vehicles).where(vehicles.c.id == identifier)).mappings().first()
            return dict(row) if row else None

    def all_vehicles(self):
        """Return the small configured fleet in a deterministic order."""
        with self.engine.connect() as db:
            return [
                dict(row) for row in db.execute(select(vehicles).order_by(vehicles.c.id)).mappings()
            ]

    def event(self, actor: str, event: str, aircraft: str, detail: str):
        """Append a bounded public-safe event; local DB operators can alter this non-attested log."""
        with self.engine.begin() as db:
            db.execute(
                insert(audit).values(
                    at=time.time(), actor=actor, event=event, aircraft=aircraft, detail=detail[:500]
                )
            )

    def records(self, table, limit: int = 100):
        """Read newest bounded evidence records; callers choose a fixed trusted table."""
        with self.engine.connect() as db:
            order = table.c.created_at if table is commands else table.c.id
            return [
                dict(row)
                for row in db.execute(select(table).order_by(order.desc()).limit(limit)).mappings()
            ]

    def observe(self, aircraft: str, sample: Sample):
        """Retain at most 300 samples per aircraft, pruning in the same transaction."""
        with self.engine.begin() as db:
            db.execute(
                insert(observations).values(aircraft=aircraft, sample=sample.model_dump_json())
            )
            keep = (
                select(observations.c.id)
                .where(observations.c.aircraft == aircraft)
                .order_by(observations.c.id.desc())
                .limit(300)
            )
            db.execute(
                delete(observations).where(
                    observations.c.aircraft == aircraft, observations.c.id.not_in(keep)
                )
            )

    def history(self, aircraft: str):
        """Return bounded chronological observations for replay and export."""
        with self.engine.connect() as db:
            return [
                json.loads(row.sample)
                for row in db.execute(
                    select(observations.c.sample)
                    .where(observations.c.aircraft == aircraft)
                    .order_by(observations.c.id)
                )
            ]

    def issue_session(self, user: str):
        """Persist only a random token digest; CSRF token and absolute eight-hour expiry are separate."""
        token, csrf = secrets.token_urlsafe(32), secrets.token_hex(32)
        with self.engine.begin() as db:
            db.execute(delete(sessions).where(sessions.c.expires < time.time()))
            db.execute(
                insert(sessions).values(
                    digest=hashlib.sha256(token.encode()).hexdigest(),
                    user=user,
                    csrf=csrf,
                    expires=time.time() + 28800,
                )
            )
        return token, csrf

    def close(self):
        """Release pooled database resources on app shutdown."""
        self.engine.dispose()
