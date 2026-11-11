"""Jason Stys: same-origin authenticated HTTP interface and static production UI.

Functions/classes/variables and source locations: docs/SOURCE_MAP.md. No external URLs,
uploads, arbitrary aircraft endpoints, plugins or executable user code are accepted.
"""

import asyncio
import hmac
import os
import time
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from starlette.middleware.trustedhost import TrustedHostMiddleware

from console import __version__
from console.auth import add_user, credentials, identity, operator, require_csrf, revoke
from console.domain import Command, Plan, Preflight
from console.replay import Replay
from console.service import Operations
from console.store import Store, audit, users


class Login(BaseModel):
    """Bounded credentials; no profile or security role can be submitted through this model."""

    model_config = ConfigDict(extra="forbid")
    username: str = Field(min_length=1, max_length=40)
    password: str = Field(min_length=1, max_length=128)


class PlanUpdate(BaseModel):
    """An optimistic mission update tied to the revision last read by the editor."""

    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=1)
    plan: Plan


class Approval(BaseModel):
    """All preflight attestations for one exact revision."""

    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=1)
    checks: Preflight


def create_app(store=None, adapter=None, origin=None, background=True, runtime_identity=None):
    """Create one workspace service. Injectable store/adapter are for independent tests only."""
    origin = origin or os.environ.get("OPS_ORIGIN", "http://127.0.0.1:8840")
    parsed = urlsplit(origin)
    if parsed.hostname not in ("127.0.0.1", "localhost") and parsed.scheme != "https":
        raise ValueError("Non-loopback deployments require an explicit HTTPS origin")
    if (
        parsed.scheme not in ("http", "https")
        or not parsed.hostname
        or parsed.path
        or parsed.query
        or parsed.fragment
        or parsed.username
    ):
        raise ValueError("OPS_ORIGIN must be a bare HTTP(S) origin")
    owned = store is None
    if owned:
        Path(".runtime").mkdir(exist_ok=True)
        store = Store(os.environ.get("OPS_DATABASE_URL", "sqlite:///.runtime/workspace.db"))
    if adapter is None and os.environ.get("OPS_ADAPTER") == "px4":
        if parsed.hostname not in ("127.0.0.1", "localhost"):
            raise ValueError("The managed PX4 lab is loopback-only, not a public flight service")
        from console.px4 import ManagedPx4

        adapter = ManagedPx4()
    adapter = adapter or Replay()
    store.seed(live=getattr(adapter, "live", False))

    @asynccontextmanager
    async def lifespan(app):
        """Start only the selected adapter and bounded sampler; cancel owned tasks at shutdown."""

        async def sample_loop():
            """Persist at most one observation per aircraft per second; no unlimited live queues."""
            while True:
                await adapter.tick()
                for aircraft, sample in adapter.samples.items():
                    store.observe(aircraft, sample)
                await asyncio.sleep(1)

        task = None
        try:
            await adapter.open([row["id"] for row in store.all_vehicles()])
            task = asyncio.create_task(sample_loop()) if background else None
            yield
        finally:
            try:
                if task:
                    task.cancel()
                    await asyncio.gather(task, return_exceptions=True)
            finally:
                try:
                    await adapter.close()
                finally:
                    if owned:
                        store.close()
            if task and not task.cancelled():
                task.result()  # Surface sampler failure, but only after releasing owned resources.

    app = FastAPI(
        title="Drone Operations Console",
        version=__version__,
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    app.state.store = store
    app.state.operations = Operations(store, adapter)
    app.state.login_attempts = deque(maxlen=100)
    app.state.auth_slots = asyncio.Semaphore(2)
    app.state.setup_lock = asyncio.Lock()
    launch_token = os.environ.get("OPS_LAUNCH_TOKEN", "")
    bootstrap = bool(launch_token and os.environ.get("OPS_DESKTOP_BOOTSTRAP") == "1")
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=[parsed.hostname])

    @app.middleware("http")
    async def boundaries(request: Request, call_next):
        """Deny cross-origin mutation and oversized bodies; attach restrictive headers on all responses."""
        if (
            launch_token
            and request.url.path != "/healthz"
            and not hmac.compare_digest(
                request.headers.get("x-ops-launch-token", "").encode(), launch_token.encode()
            )
        ):
            result = JSONResponse({"detail": "Owned desktop session required"}, status_code=403)
        elif request.method not in ("GET", "HEAD") and request.headers.get("origin") != origin:
            result = JSONResponse({"detail": "Exact configured Origin required"}, status_code=403)
        elif (
            request.method not in ("GET", "HEAD")
            and request.headers.get("content-type", "").split(";")[0] != "application/json"
        ):
            result = JSONResponse({"detail": "JSON content type required"}, status_code=415)
        else:
            total = 0
            parts = []
            async for part in request.stream():
                total += len(part)
                if total > 16384:
                    break
                parts.append(part)
            if total > 16384:
                result = JSONResponse({"detail": "Body exceeds 16 KiB"}, status_code=413)
            else:
                request._body = b"".join(parts)
                result = await call_next(request)
        result.headers.update(
            {
                "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
                "Cache-Control": "no-store",
                "X-Frame-Options": "DENY",
            }
        )
        return result

    @app.get("/healthz")
    async def health():
        """Return liveness only, without workspace content or dependency addresses."""
        return {
            "status": "ok",
            "simulation_only": True,
            "version": __version__,
            **({"launcher_nonce": os.environ.get("OPS_LAUNCH_NONCE", "")} if launch_token else {}),
            **(
                {"source_commit": runtime_identity["source_commit"]}
                if launch_token and runtime_identity
                else {}
            ),
        }

    @app.get("/api/setup")
    async def setup_status():
        """Only an owned desktop session can see the first-account form; public registration is off."""
        with store.engine.connect() as db:
            empty = db.scalar(select(func.count()).select_from(users)) == 0
        return {"setup_required": bootstrap and empty}

    @app.post("/api/setup")
    async def setup(body: Login):
        """Provision exactly one local operator, serialized within this single-worker desktop service."""
        if not bootstrap or os.environ.get("OPS_READ_ONLY") == "1":
            raise HTTPException(404, "Desktop setup unavailable")
        async with app.state.setup_lock:
            with store.engine.connect() as db:
                if db.scalar(select(func.count()).select_from(users)):
                    raise HTTPException(409, "An account already exists; sign in")
            try:
                add_user(store, body.username, body.password, "operator")
            except ValueError as error:
                raise HTTPException(422, str(error)) from error
        return {"created": True}

    @app.post("/api/login")
    async def login(body: Login, request: Request, response: Response):
        """Rate-limit credential verification globally to twelve attempts per minute per process."""
        attempts = app.state.login_attempts
        now = time.monotonic()
        while attempts and now - attempts[0] > 60:
            attempts.popleft()
        if len(attempts) >= 12:
            raise HTTPException(429, "Login budget reached; wait one minute")
        attempts.append(now)
        async with app.state.auth_slots:
            user = await asyncio.to_thread(credentials, store, body.username, body.password)
        if user is None:
            raise HTTPException(401, "Invalid credentials")
        token, csrf = store.issue_session(user["name"])
        response.set_cookie(
            "ops_session",
            token,
            httponly=True,
            secure=parsed.scheme == "https",
            samesite="strict",
            max_age=28800,
            path="/",
        )
        return {**user, "csrf": csrf}

    @app.get("/api/me")
    async def me(request: Request):
        """Return current workspace identity and CSRF, never credential/session digests."""
        user = identity(request)
        return {"name": user["user"], "role": user["role"], "csrf": user["csrf"]}

    @app.post("/api/logout")
    async def logout(request: Request, response: Response):
        """Revoke the current session and clear the HttpOnly cookie."""
        require_csrf(request, identity(request))
        revoke(request)
        response.delete_cookie("ops_session", path="/")
        return {"status": "signed out"}

    @app.get("/api/fleet")
    async def fleet(request: Request):
        """Return authenticated bounded fleet state with source/freshness labeling."""
        identity(request)
        return {
            **app.state.operations.snapshot(),
            "read_only": os.environ.get("OPS_READ_ONLY") == "1",
        }

    @app.put("/api/aircraft/{identifier}/plan")
    async def save_plan(identifier: str, body: PlanUpdate, request: Request):
        """Save a validated plan only when the operator's revision still matches."""
        user = operator(request)
        return await app.state.operations.save_plan(
            user["user"], identifier, body.plan, body.revision
        )

    @app.post("/api/aircraft/{identifier}/approve")
    async def approve(identifier: str, body: Approval, request: Request):
        """Save exact-plan attestations; this is not an aviation authorization service."""
        user = operator(request)
        return await app.state.operations.approve(
            user["user"], identifier, body.checks, body.revision
        )

    @app.post("/api/aircraft/{identifier}/commands")
    async def command(identifier: str, body: Command, request: Request):
        """Submit an exact-target idempotent intent through the server-side safety gate."""
        user = operator(request)
        return await app.state.operations.command(
            user["user"], identifier, request.headers.get("idempotency-key", ""), body
        )

    @app.get("/api/aircraft/{identifier}/history")
    async def history(identifier: str, request: Request):
        """Return up to 300 retained observations for one known aircraft."""
        identity(request)
        app.state.operations.aircraft(identifier)
        return {"aircraft_id": identifier, "samples": store.history(identifier)}

    @app.get("/api/evidence")
    async def evidence(request: Request):
        """Export bounded review evidence without auth material; JSON is not executable HTML."""
        identity(request)
        return JSONResponse(
            {
                "schema": 1,
                "simulation_only": True,
                "fleet": app.state.operations.snapshot(),
                "audit": store.records(audit),
                "note": "Acknowledgement is not physical outcome or flight certification",
            },
            headers={"Content-Disposition": 'attachment; filename="simulation-evidence.json"'},
        )

    @app.get("/api/audit")
    async def audit_records(request: Request):
        """Show newest 100 same-workspace audit events to authenticated workspace viewers."""
        identity(request)
        return store.records(audit)

    ui = Path(os.environ.get("OPS_UI_DIR", "dist"))
    if ui.is_dir():
        app.mount("/", StaticFiles(directory=str(ui), html=True), name="ui")
    return app
