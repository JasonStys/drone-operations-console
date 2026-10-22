# Validation record — 0.1.0

By Jason Stys. Development observations are not release certification.

## Measured results

Verification performed 2026-10-21/22. The final local Windows/Python 3.14 suite passed
**64 tests at 97.88% statement coverage** for controller/domain/auth/store/replay.
Native conversion/cleanup regression fixtures are synthetic unit inputs, not flight
evidence, and the native adapter remains outside that coverage denominator.

Three TypeScript tests passed at 100% coverage of the small geometry/freshness module,
not the entire React UI. Twelve actual-service browser journeys passed across
Chromium, Firefox and WebKit, including approve/upload/start/hold/return, viewer
permissions, logout, replay/download, axe scans, mobile overflow, unsaved-draft
blocking and cancellation of the real confirmation dialog.

The [first complete green Validation run](https://github.com/JasonStys/drone-operations-console/actions/runs/39700515246)
tested source `c2b91fd65842919354ca478b49f624b7537ece1b` (57 Python tests before the
additional lifecycle/invalid-value regressions). All eight jobs passed: Linux Python
3.12/3.14, Windows/macOS Python 3.14, three-browser integration, PostgreSQL,
container/Bicep and actual PX4. The accompanying
[CodeQL run](https://github.com/JasonStys/drone-operations-console/actions/runs/39700515237)
completed successfully; its three quality findings were reviewed and addressed in
the subsequent cleanup changes rather than dismissed. Check the
[latest Validation](https://github.com/JasonStys/drone-operations-console/actions/workflows/validate.yml)
and [CodeQL](https://github.com/JasonStys/drone-operations-console/actions/workflows/codeql.yml)
runs for the current main commit, including those final regressions.

Native PX4, PostgreSQL, image and Azure-template validation are separate gates;
they are not inferred from those replay tests. The native acceptance prints only
post-assertion records with pinned PX4 source and built executable hashes. A missing
dependency or failed native assertion must fail CI rather than turn into a mock.

The native run built PX4 v1.17.0 at commit
`d6f12ad1c4f70ad3230afd7d86e971421e02fef4` and used MAVSDK 4.0.6. It observed mission
takeoff at 3.915 m relative altitude, actual HOLD, return/landing/disarm at 0.414 m,
and HTTP 409 rejection after the owned simulator stopped. Four distinct command
records remained after duplicate upload; the wrong-target request was rejected.
[Native evidence excerpt](NATIVE_ACCEPTANCE.json) records the observed build hash
and measurements; the source-linked job log contains the full post-assertion JSON.
These are simulator observations, not hardware-in-loop or real-aircraft evidence.

PostgreSQL accepted twenty concurrent duplicate requests with one intent ID and
verified durable reopen. The image ran as UID 10001 with a read-only root filesystem,
no capabilities and no-new-privileges; private data returned HTTP 401 anonymously.
The pinned Bicep compiler successfully compiled the private read-only cloud reference.
No Azure deployment was performed. Locked Python/npm audits reported no known
vulnerabilities at test time; this is not a guarantee against future vulnerabilities.
The production gzip size gate passed its unchanged 100,000-byte JS / 12,000-byte CSS
budgets. Ruff, formatting, strict TypeScript, source maps and file/header checks passed.

## Failure history and limitations

Windows restricted setup first hit temporary-directory/package-cache access errors;
normal scoped process permissions and a repo-local temporary/cache directory were
used. An incorrect unpublished build-dependency pin was corrected from registry
metadata before integration. No Docker repair or host aircraft connection occurred.
No thresholds were relaxed, and failed setup attempts are not counted as passes.

The first Actions attempt exposed platform-dependent catalog sorting, a pre-existing
Debian `operator` group collision and an incorrect legacy battery-unit assumption.
Explicit POSIX-path sorting, a dedicated container identity and version-correct native
percentage points fixed the causes. New unit tests cover 0/1/25/92/100%, invalid native
percentages, startup failure and background-task cleanup. Cleanup drains cancelled
tasks, releases resources and still propagates unexpected faults. One upstream
Starlette TestClient/httpx deprecation warning remains visible; it is not suppressed.
Native logs also recorded ignored duplicate command acknowledgements; acceptance
relies on actual observed mode/motion, not the absence of SDK warning messages.

Storage checked before Actions: 62,959,952 current artifact bytes and a separate
8,185,324,614 cache bytes, then rechecked across 96 owned repositories after creation;
billing percentage unavailable.
No runs, artifacts or caches were deleted. New workflows disable artifact/cache
uploads; public Actions logs remain the validation audit trail. No paid cloud or
private user data was used. Failed runs remain available as an honest audit trail.
