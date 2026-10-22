"""Jason Stys: Argon2id credentials, opaque cookie sessions, roles and CSRF enforcement.

Functions/variables and exact lines: docs/SOURCE_MAP.md. No password/token enters audit logs.
Trusted OS/database administrators remain within the local application's trust boundary.
"""

import hashlib
import hmac
import os
import re
import time

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import HTTPException, Request
from sqlalchemy import delete, insert, select

from console.store import sessions, users

hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=1)
DUMMY = hasher.hash("synthetic-timing-equalizer-not-an-account")


def add_user(store, name: str, password: str, role: str):
    """Create a CLI-provisioned user. Validate name, password length and fixed role vocabulary."""
    if not re.fullmatch(r"[a-z][a-z0-9-]{2,39}", name) or role not in (
        "viewer",
        "operator",
        "admin",
    ):
        raise ValueError("use a 3–40 character lowercase username and viewer/operator/admin role")
    if not 14 <= len(password) <= 128:
        raise ValueError("password must have 14–128 characters")
    with store.engine.begin() as db:
        db.execute(insert(users).values(name=name, password_hash=hasher.hash(password), role=role))


def credentials(store, name: str, password: str):
    """Check a credential with a dummy hash for unknown users; return no hash to callers."""
    with store.engine.connect() as db:
        row = db.execute(select(users).where(users.c.name == name)).mappings().first()
    try:
        hasher.verify(row["password_hash"] if row else DUMMY, password)
    except (VerificationError, InvalidHashError):
        return None
    return {"name": row["name"], "role": row["role"]} if row else None


def identity(request: Request):
    """Resolve unexpired session and current role; never trust UI-selected roles."""
    token = request.cookies.get("ops_session", "")
    if not 20 <= len(token) <= 100:
        raise HTTPException(401, "Sign in to view this workspace")
    digest = hashlib.sha256(token.encode()).hexdigest()
    with request.app.state.store.engine.connect() as db:
        row = (
            db.execute(
                select(sessions.c.user, sessions.c.csrf, users.c.role)
                .join(users, sessions.c.user == users.c.name)
                .where(sessions.c.digest == digest, sessions.c.expires > time.time())
            )
            .mappings()
            .first()
        )
    if row is None:
        raise HTTPException(401, "Session expired or revoked")
    return dict(row)


def operator(request: Request):
    """Require operator/admin plus session-specific CSRF; origin is checked by middleware."""
    user = identity(request)
    if os.environ.get("OPS_READ_ONLY") == "1":
        raise HTTPException(403, "Deployment is read-only; mission controls are disabled")
    if user["role"] not in ("operator", "admin"):
        raise HTTPException(403, "Operator role required")
    require_csrf(request, user)
    return user


def require_csrf(request: Request, user):
    """Compare fixed-size CSRF values in constant time, including sign-out requests."""
    if not hmac.compare_digest(request.headers.get("x-csrf-token", ""), user["csrf"]):
        raise HTTPException(403, "CSRF token required")


def revoke(request: Request):
    """Delete only the current cookie session; preserve other users and their sessions."""
    digest = hashlib.sha256(request.cookies.get("ops_session", "").encode()).hexdigest()
    with request.app.state.store.engine.begin() as db:
        db.execute(delete(sessions).where(sessions.c.digest == digest))
