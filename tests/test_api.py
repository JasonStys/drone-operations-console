"""Jason Stys: real HTTP session, authorization, durable intents and private evidence tests.

Tests/variables and exact lines: docs/SOURCE_MAP.md. Native PX4 is a separate genuine CI gate.
"""

import asyncio
import time

import pytest
from sqlalchemy import insert, select, update

from console.api import create_app
from console.auth import add_user, credentials
from console.domain import default_plan
from console.replay import Replay
from console.store import Store, commands, sessions, users
from tests.conftest import PASSWORD, approve, command, sign_in


def test_private_session_and_logout(client, workspace):
    """Anonymous access fails; sessions use opaque cookies and logout invalidates server state."""
    assert client.get("/api/fleet").status_code == 401
    assert client.get("/healthz").json()["simulation_only"] is True
    response = sign_in(client)
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=strict" in cookie
    assert client.get("/api/me").json()["role"] == "operator"
    body = client.get("/api/fleet").json()
    assert [row["id"] for row in body["aircraft"]] == ["atlas", "ember", "relay"]
    assert client.post("/api/logout", json={}).status_code == 200
    assert client.get("/api/me").status_code == 401
    with workspace.engine.connect() as db:
        assert db.execute(select(sessions)).first() is None


@pytest.mark.parametrize("name,password", [("unknown", PASSWORD), ("pilot", "wrong")])
def test_bad_credentials(client, name, password):
    """Unknown and known-but-wrong names return the same public response."""
    response = client.post("/api/login", json={"username": name, "password": password})
    assert response.status_code == 401 and response.json()["detail"] == "Invalid credentials"


def test_rate_limit(client):
    """A fixed global budget prevents unlimited expensive password verification."""
    client.app.state.login_attempts.extend([time.monotonic()] * 12)
    assert (
        client.post("/api/login", json={"username": "pilot", "password": PASSWORD}).status_code
        == 429
    )
    client.app.state.login_attempts.clear()
    client.app.state.login_attempts.append(time.monotonic() - 61)
    sign_in(client)


def test_http_boundaries(client):
    """Host, Origin, content type, body size and response hardening do not rely on frontend code."""
    assert client.get("/healthz", headers={"Host": "evil.invalid"}).status_code == 400
    assert (
        client.post("/api/login", json={}, headers={"Origin": "https://evil.invalid"}).status_code
        == 403
    )
    assert (
        client.post("/api/login", content="bad", headers={"Content-Type": "text/plain"}).status_code
        == 415
    )
    assert (
        client.post(
            "/api/login", content="x" * 17000, headers={"Content-Type": "application/json"}
        ).status_code
        == 413
    )
    headers = client.get("/healthz").headers
    assert "frame-ancestors 'none'" in headers["content-security-policy"]
    assert "connect-src 'self'" in headers["content-security-policy"]
    assert headers["cache-control"] == "no-store"


def test_roles_csrf_and_expiry(client, workspace):
    """Viewer, missing CSRF, role removal and expired sessions are enforced on the server."""
    sign_in(client, "reader")
    assert approve(client).status_code == 403
    sign_in(client)
    client.headers["X-CSRF-Token"] = "wrong"
    assert approve(client).status_code == 403
    sign_in(client)
    with workspace.engine.begin() as db:
        db.execute(update(users).where(users.c.name == "pilot").values(role="viewer"))
    assert command(client).status_code == 403
    with workspace.engine.begin() as db:
        db.execute(update(sessions).values(expires=time.time() - 1))
    assert client.get("/api/me").status_code == 401


def test_complete_rehearsal(client):
    """Exact approval, upload, start, hold and return each produce auditable distinct intents."""
    sign_in(client)
    assert command(client).status_code == 409
    assert approve(client).status_code == 200
    assert command(client, "start").status_code == 409
    for index, action in enumerate(("upload", "start", "hold", "return")):
        response = command(client, action, key=f"rehearsal-{index}")
        assert response.status_code == 200 and response.json()["status"] == "accepted"
    audit = client.get("/api/audit").json()
    assert len([row for row in audit if row["event"] == "command.accepted"]) == 4
    export = client.get("/api/evidence")
    assert "attachment" in export.headers["content-disposition"]
    assert "password_hash" not in export.text and "csrf" not in export.text


def test_idempotent_target_and_revision(client):
    """Repeat means one effect; changing action/target/revision under the same key is a conflict."""
    sign_in(client)
    approve(client)
    one, two = command(client), command(client)
    assert one.json()["id"] == two.json()["id"]
    assert command(client, "start").status_code == 409
    assert command(client, target="ember", key="wrong-target").status_code == 409
    assert command(client, aircraft="unknown").status_code == 404
    assert command(client, revision=2, key="wrong-revision").status_code == 409
    assert command(client, key="bad").status_code == 422


def test_edit_clears_approval_and_conflicts(client):
    """A saved draft clears attestation and an older browser cannot overwrite it."""
    sign_in(client)
    approve(client)
    body = {"revision": 1, "plan": default_plan().model_dump()}
    first = client.put("/api/aircraft/atlas/plan", json=body)
    assert first.status_code == 200 and first.json()["approved_by"] is None
    assert client.put("/api/aircraft/atlas/plan", json=body).status_code == 409
    assert approve(client, revision=1).status_code == 409
    assert command(client, revision=2).status_code == 409
    assert approve(client, revision=2).status_code == 200
    assert command(client, revision=2).json()["status"] == "accepted"


def test_missing_attestation_and_unsafe_aircraft(client):
    """Low reserve and stale arrival remain blocked even after the operator attests all checks."""
    sign_in(client)
    missing = {k: False for k in ("airspace", "area_clear", "battery", "link", "simulation")}
    assert (
        client.post(
            "/api/aircraft/atlas/approve", json={"revision": 1, "checks": missing}
        ).status_code
        == 422
    )
    for aircraft in ("ember", "relay"):
        approve(client, aircraft)
        assert command(client, aircraft=aircraft, key=f"unsafe-{aircraft}").status_code == 409


def test_expired_or_other_actor_approval(client, workspace):
    """Approval cannot be inherited from another operator or used after ten minutes."""
    from console.store import vehicles

    sign_in(client)
    approve(client)
    with workspace.engine.begin() as db:
        db.execute(
            update(vehicles).where(vehicles.c.id == "atlas").values(approved_at=time.time() - 601)
        )
    assert command(client).status_code == 409
    approve(client)
    sign_in(client, "admin")
    assert command(client).status_code == 409


@pytest.mark.parametrize(
    "error,status",
    [
        (TimeoutError(), "unknown"),
        (RuntimeError("private native detail"), "unknown"),
        (ValueError("private native detail"), "rejected"),
    ],
)
def test_ambiguous_and_rejected_effects(client, error, status, monkeypatch):
    """Timeout is unknown, not false success; internal transport details do not leak."""

    async def fail(*_args):
        raise error

    sign_in(client)
    approve(client)
    monkeypatch.setattr(client.app.state.operations.adapter, "execute", fail)
    response = command(client)
    assert response.json()["status"] == status
    assert "private native detail" not in response.text
    assert command(client).json()["id"] == response.json()["id"]


def test_sample_history_bounded(client, workspace):
    """Only the most recent 300 observations for an exact aircraft enter replay."""
    from tests.test_domain import sample

    sign_in(client)
    for index in range(305):
        workspace.observe("atlas", sample(sequence=index))
    values = client.get("/api/aircraft/atlas/history").json()["samples"]
    assert len(values) == 300 and values[0]["sequence"] == 5 and values[-1]["sequence"] == 304
    assert client.get("/api/aircraft/unknown/history").status_code == 404


def test_crash_recovery_does_not_resend(workspace, tmp_path):
    """Restart converts durable pending effects to unknown rather than replaying them."""
    with workspace.engine.begin() as db:
        db.execute(
            insert(commands).values(
                id="pending",
                actor="pilot",
                key="crash-case",
                fingerprint="a" * 64,
                boot_id="boot",
                revision=1,
                aircraft="atlas",
                action="start",
                status="pending",
                message="reserved",
                created_at=time.time(),
            )
        )
    restarted = Store(str(workspace.engine.url))
    try:
        restarted.recover_pending()
        assert restarted.records(commands)[0]["status"] == "unknown"
        restarted.seed()
        restarted.seed()
        assert len(restarted.all_vehicles()) == 3
    finally:
        restarted.close()


@pytest.mark.parametrize(
    "name,password,role",
    [("x", PASSWORD, "operator"), ("valid", "short", "operator"), ("valid", PASSWORD, "owner")],
)
def test_user_provisioning_validation(workspace, name, password, role):
    """CLI administrative inputs cannot create ambiguous identities or unsupported roles."""
    with pytest.raises(ValueError):
        add_user(workspace, name, password, role)


def test_invalid_hash_and_origin(workspace):
    """Corrupted hashes fail closed and non-loopback plaintext origins are refused."""
    with workspace.engine.begin() as db:
        db.execute(update(users).where(users.c.name == "pilot").values(password_hash="invalid"))
    assert credentials(workspace, "pilot", PASSWORD) is None
    for origin in (
        "http://public.invalid",
        "http://127.0.0.1/path",
        "file:///bad",
        "https://u:p@public.invalid",
    ):
        with pytest.raises(ValueError):
            create_app(workspace, origin=origin)


def test_replay_route_and_unknown_action():
    """Logical replay advances bounded points and never falls back to arbitrary command strings."""

    async def scenario():
        adapter = Replay()
        await adapter.open(["atlas"])
        await adapter.execute("atlas", "upload", default_plan())
        await adapter.execute("atlas", "start", default_plan())
        for _ in range(60):
            await adapter.tick()
        assert adapter.samples["atlas"].mode == "HOLD"
        assert adapter.samples["atlas"].east_m == 0
        assert adapter.samples["atlas"].north_m == 40
        with pytest.raises(ValueError):
            await adapter.execute("atlas", "shell", default_plan())
        await adapter.close()

    asyncio.run(scenario())


def test_upload_does_not_survive_service_boot(client):
    """Persisted acknowledgement is history, not permission to start a new adapter instance."""
    from console.service import Operations

    sign_in(client)
    approve(client)
    assert command(client).json()["status"] == "accepted"
    old = client.app.state.operations
    client.app.state.operations = Operations(old.store, old.adapter)
    assert command(client, "start", key="new-boot-start").status_code == 409


def test_armed_edits_and_uploads_blocked(client):
    """No plan can be replaced while the managed rehearsal is armed."""
    sign_in(client)
    approve(client)
    command(client)
    assert command(client, "start", key="armed-start").json()["status"] == "accepted"
    body = {"revision": 1, "plan": default_plan().model_dump()}
    assert client.put("/api/aircraft/atlas/plan", json=body).status_code == 409
    assert command(client, key="armed-upload").status_code == 409


def test_cloud_read_only_is_server_enforced(client, monkeypatch):
    """An operator cannot bypass a read-only cloud profile using direct HTTP requests."""
    sign_in(client)
    monkeypatch.setenv("OPS_READ_ONLY", "1")
    assert client.get("/api/fleet").json()["read_only"] is True
    assert approve(client).status_code == 403
    assert command(client).status_code == 403


def test_concurrent_duplicate_one_effect(workspace):
    """Independent counter oracle checks one side effect, not just identical response IDs."""
    from console.domain import CHECKS, Command, Preflight
    from console.service import Operations

    class CountedReplay(Replay):
        """Count dispatches independently of the database command row count."""

        calls = 0

        async def execute(self, *args):
            self.calls += 1
            await asyncio.sleep(0)
            return await super().execute(*args)

    async def scenario():
        workspace.seed()
        adapter = CountedReplay()
        await adapter.open([row["id"] for row in workspace.all_vehicles()])
        ops = Operations(workspace, adapter)
        await ops.approve("pilot", "atlas", Preflight(**dict.fromkeys(CHECKS, True)), 1)
        intent = Command(aircraft_id="atlas", revision=1, action="upload")
        rows = await asyncio.gather(
            *(ops.command("pilot", "atlas", "concurrent-key", intent) for _ in range(20))
        )
        assert len({row["id"] for row in rows}) == 1
        assert adapter.calls == 1

    asyncio.run(scenario())
