# Test strategy and acceptance plan

By Jason Stys. Cover authority, actual native behavior, persistence and operator
comprehension boundaries—not a claim of all conceivable code/aviation test types.

| Risk | Independent checks |
| --- | --- |
| Wrong unit, coordinate, nonfinite or oversized route | Domain oracles, finite/count/distance limits; TypeScript 3-4-5 triangle and direction checks. |
| Stale link, low battery or unavailable position | Exact boundary tests, deliberately unhealthy replay aircraft and actual PX4 process-loss test. |
| Wrong aircraft/revision/operator | HTTP negative cases, exact-target confirmation, actor-bound approval and optimistic edits. |
| Duplicate or ambiguous side effect | Concurrent duplicate tests, SQL uniqueness, timeout/transport unknown state and restart/boot regression. |
| Unauthorized use or private export leakage | Real sessions, roles, CSRF/Origin/Host/body bounds, logout/expiry, no secret fields in exports. |
| UI drift | Actual production UI + API on loopback, three browser engines, real downloads, axe and 390 px overflow. |
| SQLite-only confidence | Separate PostgreSQL 20-request duplicate and durable reopen acceptance. |
| Mocked drone presented as real | Pinned upstream PX4 build + native MAVSDK + actual authenticated ASGI requests; observed takeoff/hold/return/disarm. |
| Unsafe deployment | Non-root/read-only container smoke, bound loopback port, private read-only Bicep reference compilation, dependency audits and CodeQL. |

Python: >=85% statement coverage for controller/domain/auth/store/replay. Native
`px4.py` is outside that denominator; genuine integration asserts effects separately.
Frontend: >=95% statements/functions/lines and >=90% branches for pure grid utilities;
React UI is covered through actual browser behavior, not a misleading whole-UI score.
CI must not suppress assertions, convert missing dependencies into passing mocks,
raise size budgets merely to hide regressions, or delete failed attempts.

## Commands and interpretation

Run the README sequence from the repo root. Playwright needs the exact locked
browser revisions; `npx playwright install` installs them. Windows restricted
processes may require normal user permissions and a writable temporary directory.
Do not disable browser sandboxing to make tests pass. Browser tests use only newly
created disposable workspaces and known synthetic credentials.

Native acceptance requires Linux, the exact PX4 checkout/build and
`requirements-sitl.lock`. `python tools/native_acceptance.py` must create genuine
post-assertion records; its report includes PX4 source and executable SHA-256.
This hash binds the observed build, not a reproducible-build or hardware attestation.
CI tests the actual ASGI/controller/SDK path; separate browser tests use replay.
No real drone, radio, flight controller, cloud account or external AI API is tested.

Known gaps: screen-reader speech output, usability study with operators, real RF,
hardware-in-loop, airworthiness, public hostile multi-tenant deployment and actual
Azure resources. Real data and cloud use require permission and separate review.
