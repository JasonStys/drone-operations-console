# Validation record — 0.1.0

By Jason Stys. Development observations are not release certification.

Initial local Windows/Python 3.14 verification passed 47 backend tests at 97.33%
controller/domain/auth/store/replay statement coverage. Three pure TypeScript tests
passed at 100% coverage of that small geometry/freshness module. Nine actual-service
browser journeys passed across Chromium, Firefox and WebKit, including operator
approve/upload/start/hold/return, viewer permissions, logout, replay/download,
full-workspace axe scans and mobile overflow. These are initial observations; later
regressions and final exact-commit Actions results must be checked before release.

Native PX4, PostgreSQL, image and Azure-template validation are separate gates;
they are not inferred from those replay tests. The native acceptance prints only
post-assertion records with pinned PX4 source and built executable hashes. A missing
dependency or failed native assertion must fail CI rather than turn into a mock.

Windows restricted setup first hit temporary-directory/package-cache access errors;
normal scoped process permissions and a repo-local temporary/cache directory were
used. An incorrect unpublished build-dependency pin was corrected from registry
metadata before integration. No Docker repair or host aircraft connection occurred.
No thresholds were relaxed, and failed setup attempts are not counted as passes.

Storage checked before Actions: 62,959,952 current artifact bytes and a separate
8,185,324,614 cache bytes across 95 owned repositories; billing percentage unavailable.
No runs, artifacts or caches were deleted. New workflows disable artifact/cache
uploads; public Actions logs remain the validation audit trail. No paid cloud or
private user data was used. Final verified run links will be recorded after gates pass.
