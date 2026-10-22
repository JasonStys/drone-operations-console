"""Jason Stys: isolated test workspaces and synthetic credentials; no production accounts.

Fixtures/variables and exact lines: docs/SOURCE_MAP.md. Each test owns its SQL state.
"""

import pytest
from fastapi.testclient import TestClient

from console.api import create_app
from console.auth import add_user
from console.replay import Replay
from console.store import Store

PASSWORD = "synthetic-test-password-42"
ORIGIN = "http://127.0.0.1:8841"


@pytest.fixture
def workspace(tmp_path):
    """Provide three synthetic roles with a new private SQLite database per test."""
    store = Store(f"sqlite:///{tmp_path / 'test.db'}")
    for name, role in [("pilot", "operator"), ("reader", "viewer"), ("admin", "admin")]:
        add_user(store, name, PASSWORD, role)
    yield store
    store.close()


@pytest.fixture
def client(workspace):
    """Run the actual API lifespan without a nondeterministic background sampler."""
    app = create_app(workspace, Replay(), ORIGIN, background=False)
    with TestClient(app, base_url=ORIGIN, headers={"Origin": ORIGIN}) as result:
        yield result


def sign_in(client, name="pilot"):
    """Sign in through HTTP and attach the returned session-specific CSRF token."""
    response = client.post("/api/login", json={"username": name, "password": PASSWORD})
    assert response.status_code == 200
    client.headers["X-CSRF-Token"] = response.json()["csrf"]
    return response


def approve(client, aircraft="atlas", revision=1):
    """Attest all five synthetic preflight checks through the actual authorization gate."""
    return client.post(
        f"/api/aircraft/{aircraft}/approve",
        json={
            "revision": revision,
            "checks": {
                k: True for k in ("airspace", "area_clear", "battery", "link", "simulation")
            },
        },
    )


def command(
    client, action="upload", aircraft="atlas", revision=1, key="test-key-0001", target=None
):
    """Submit a fully specified command; target can deliberately differ for negative tests."""
    return client.post(
        f"/api/aircraft/{aircraft}/commands",
        json={"aircraft_id": target or aircraft, "revision": revision, "action": action},
        headers={"Idempotency-Key": key},
    )
