"""Jason Stys: desktop capability, first-user and browser isolation negative tests. Declarations: docs/SOURCE_MAP.md."""

from fastapi.testclient import TestClient

from console.api import create_app
from console.auth import credentials
from console.replay import Replay
from console.store import Store
from tests.conftest import ORIGIN, PASSWORD


def test_web_registration_is_off(client):
    """A normal browser deployment cannot turn the desktop-only bootstrap into public signup."""
    assert client.get("/api/setup").json() == {"setup_required": False}
    assert (
        client.post("/api/setup", json={"username": "intruder", "password": PASSWORD}).status_code
        == 404
    )


def test_desktop_first_user_and_owned_session(monkeypatch, tmp_path):
    """Fresh profiles bootstrap once; launch capability and normal Origin/CSRF are independently required."""
    monkeypatch.setenv("OPS_LAUNCH_TOKEN", "a" * 64)
    monkeypatch.setenv("OPS_LAUNCH_NONCE", "test-nonce")
    monkeypatch.setenv("OPS_DESKTOP_BOOTSTRAP", "1")
    store = Store(f"sqlite:///{tmp_path / 'test.db'}")
    app = create_app(store, Replay(), ORIGIN, background=False)
    try:
        with TestClient(app, base_url=ORIGIN, headers={"Origin": ORIGIN}) as client:
            assert client.get("/healthz").json()["launcher_nonce"] == "test-nonce"
            assert client.get("/api/setup").status_code == 403
            assert client.get("/api/fleet").status_code == 403
            client.headers["X-Ops-Launch-Token"] = "a" * 64
            assert client.get("/api/setup").json()["setup_required"] is True
            assert (
                client.post(
                    "/api/setup", json={"username": "bad name", "password": PASSWORD}
                ).status_code
                == 422
            )
            assert (
                client.post(
                    "/api/setup", json={"username": "presenter", "password": "too-short"}
                ).status_code
                == 422
            )
            assert (
                client.post(
                    "/api/setup",
                    json={"username": "presenter", "password": PASSWORD},
                    headers={"Origin": "https://evil.invalid"},
                ).status_code
                == 403
            )
            assert (
                client.post(
                    "/api/setup", json={"username": "presenter", "password": PASSWORD}
                ).status_code
                == 200
            )
            assert client.get("/api/setup").json()["setup_required"] is False
            assert credentials(store, "presenter", PASSWORD)["role"] == "operator"
            assert (
                client.post(
                    "/api/setup", json={"username": "another-user", "password": PASSWORD}
                ).status_code
                == 409
            )
            session = client.post(
                "/api/login", json={"username": "presenter", "password": PASSWORD}
            ).json()
            assert client.get("/api/fleet").status_code == 200
            assert client.post("/api/logout", json={}).status_code == 403
            assert (
                client.post(
                    "/api/logout", json={}, headers={"X-CSRF-Token": session["csrf"]}
                ).status_code
                == 200
            )
    finally:
        store.close()
