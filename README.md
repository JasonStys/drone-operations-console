# Drone Operations Console

[![Validation](https://github.com/JasonStys/drone-operations-console/actions/workflows/validate.yml/badge.svg)](https://github.com/JasonStys/drone-operations-console/actions/workflows/validate.yml)
[![CodeQL](https://github.com/JasonStys/drone-operations-console/actions/workflows/codeql.yml/badge.svg)](https://github.com/JasonStys/drone-operations-console/actions/workflows/codeql.yml)

**Observe the fleet. Review the plan. Preserve the evidence.** A simulator-only
operator web application designed and engineered by [Jason Stys](https://github.com/JasonStys).
TypeScript/React provides the interface; Python/FastAPI enforces authority and
safety; SQL records missions, approvals and command outcomes; the optional native
MAVSDK C++ library connects to an app-owned, pinned PX4 SIH simulator.

This is an original engineering portfolio prototype—not a fork of a ground station,
not a flight controller and not operational flight software. There is no real-aircraft,
serial-radio, targeting, surveillance-identification or arbitrary endpoint feature.
The simulated launch coordinates are PX4's public training defaults, not a user location.

## What it demonstrates

- **Fleet awareness:** three fictional replay aircraft show ready, low-battery and
  stale-link conditions. Positions, relative altitude, speed, battery and arrival
  freshness use explicit SI units and a local north/east grid. No external maps,
  trackers, AI providers or location permissions are required.
- **Mission editor:** bounded waypoints, speed and route distance; exact revision
  conflicts prevent a stale editor overwriting another saved draft. Edits clear
  preflight approvals, and armed aircraft cannot have their plan edited/uploaded.
- **Review before execution:** five attestations bind to an exact aircraft, plan
  revision, operator and ten-minute window. A separate confirmation names the target.
  The server—not a disabled browser button—checks authority, freshness and reserve.
- **Durable command intents:** upload/start/hold/return have idempotency keys and
  persistent outcomes. Duplicates do not repeat effects. Restarted pending commands
  become unknown, never automatically resent; uploads from an older service boot
  cannot authorize a new simulator. An acknowledgement is not physical completion.
- **Private workspace:** CLI-provisioned viewer/operator/admin accounts, Argon2id
  password hashes, opaque HttpOnly sessions, CSRF checks, exact Origin/Host checks,
  bounded request bodies, rate-limited login and restrictive browser headers.
- **Replay and evidence:** latest 300 observations per aircraft, command history,
  audit review and JSON downloads. Exports exclude password/session hashes and CSRF.
- **Genuine integration:** an isolated CI job builds pinned PX4 source and exercises
  the real native MAVSDK/API path. Replay, mocked/unit results and actual simulator
  evidence are kept separate. Missing PX4 never silently falls back to replay.
- **Deployment:** digest-pinned non-root container; native PostgreSQL acceptance;
  a private, read-only Azure Container Apps reference with Key Vault secret references.
  No cloud account, paid resource, public host or AKS cluster is created by this repo.

## Quick start: local replay

Requirements: Python 3.12–3.14, Node.js 24, npm and Git. From a fresh clone:

```sh
git clone https://github.com/JasonStys/drone-operations-console.git
cd drone-operations-console
python -m venv .venv
# Windows PowerShell: .venv/Scripts/Activate.ps1
# Linux/macOS: source .venv/bin/activate
python -m pip install --require-hashes -r requirements-dev.lock
npm ci --ignore-scripts
npm run build
python -m console --create-user your-name --role operator
python -m console
```

Choose your own password through the hidden prompt (14–128 characters). Open
**http://127.0.0.1:8840/**. There is **no default production password**. Runtime data
is stored in ignored `.runtime/workspace.db`; keep this folder private and back it
up separately. Protect it with your OS account and disk encryption. It is not an
encrypted vault or a way to hide data from your own OS/database administrators.

For a disposable demonstration with explicitly synthetic accounts, use
`python tools/serve_test.py` after building and visit **http://127.0.0.1:8841/**.
Accounts `pilot` (operator) and `reader` (viewer) both use the clearly test-only
password `synthetic-test-password-42`. That server creates a new temporary database,
binds only loopback and must never be exposed publicly or used for private information.

### First rehearsal

1. Sign in, select Atlas and review its observations.
2. Edit/save a plan if desired; review the current revision and all five checks.
3. Approve, upload, then start. Confirm the exact aircraft/revision at each step.
4. Observe the moving replay point. Hold and return affect only the rehearsal.
5. Load retained replay, refresh audit or download JSON evidence.

Ember deliberately has insufficient reserve. Relay deliberately has stale telemetry.
The operator guide is available in the UI; [operations](docs/OPERATIONS.md) explains
recovery, users, timeouts, native simulator setup and container deployment.

## Verification

```sh
python -m ruff check console tests tools
python -m ruff format --check console tests tools
python -m pytest --cov=console --cov-report=term-missing
npm run format:check
npm test
npm run build
python tools/docs_index.py --check
python tools/check_repo.py --dist
npx playwright install chromium firefox webkit
npm run test:e2e
npm run audit
python -m pip_audit --disable-pip --no-deps -r requirements-dev.lock
```

Core Python statement coverage has an 85% gate; pure TypeScript route/freshness
utilities have separate 95% statements / 90% branches gates. Native PX4 and UI
journeys are integration tests, not part of either unit-coverage denominator.
See [test strategy](docs/TESTING.md) and [observed validation](docs/VALIDATION.md).
Actions logs preserve native acceptance records; caches and artifact uploads are off.

## Structure and major responsibilities

| Path | Responsibility |
| --- | --- |
| `console/domain.py` | Strict typed plans, units, geometry, freshness and safety blockers. |
| `console/auth.py` | Provisioned identities, Argon2id verification, sessions, roles and CSRF. |
| `console/store.py` | SQL schema, transactions, bounded observation history and private sessions. |
| `console/service.py` | Revision-bound approvals, boot-bound uploads and durable command dispatch. |
| `console/replay.py` | Explicit synthetic logical rehearsal, not a physics simulator. |
| `console/px4.py` | App-owned pinned Linux PX4 process and native MAVSDK observations/commands. |
| `console/api.py` | Hardened authenticated API and production UI delivery. |
| `console/__main__.py` | Local provisioning and single-worker loopback launcher. |
| `ui/` | Accessible React UI, responsive styling and independently tested grid utilities. |
| `tests/` | Independent safety/security/state oracles and real browser journeys. |
| `tools/` | Native PX4/PostgreSQL acceptance, temporary demo server and repository checks. |
| `deploy/`, `Dockerfile` | Private cloud reference and digest-pinned non-root container. |
| `.github/workflows/` | Multi-OS tests, browser/SQL/native/container gates and CodeQL. |
| `docs/` | Design, security, operations, research, test reports and exact source/file indexes. |

Every authored file is summarized in [FILE_CATALOG](docs/FILE_CATALOG.md). Source
headers link to the generated [SOURCE_MAP](docs/SOURCE_MAP.md), which lists function,
class, parameter and variable declaration lines without stale hand-numbered headers.

## Limits that matter

This does not establish safe real flight, legal permission, complete traffic coverage,
airworthiness, FAA/DoD certification or employer endorsement. The preflight boxes are
attestations, not independent fact verification. Recovery commands can fail. Replay
returns home immediately and does not model wind, energy use or vehicle dynamics.
The grid is a small-area approximation, not navigation/cartography software.

The native adapter supports **one managed PX4 SIH quadrotor on Linux**, not arbitrary
aircraft, autopilots or mobile hardware. A trusted OS could proxy loopback or replace
the binary; commit/hash checks are not attestation against that attacker. Native
SDK fields have different update behavior; arrival freshness represents position,
and health/armed/mode are latest reported state, not independent truth. This is a
single-process, same-workspace prototype, not multi-tenant SaaS. Cloud reference
operation is read-only; a public or operational deployment needs additional review.

Contact: [Jason Stys on LinkedIn](https://www.linkedin.com/in/jason-stys-31b30b351/).
Use GitHub issues for reproducible **non-sensitive** questions; never post passwords,
personal flight records or credentials. [Security boundaries](docs/SECURITY.md).
