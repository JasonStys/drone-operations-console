# Reusable scene and native-app validation

Jason Stys, 2026-11-09. Owned loopback test services and fictional accounts only.
Existing operator accounts, user missions and installed-app data were untouched.

## Practical workflows

Users can draft bounded friendly routes/waypoints, deliberately apply them, save
and reopen strict UTF-8 scene inputs and scrub deterministic replay while paused.
Malformed files, duplicate/invalid IDs, unknown fields, nonfinite/out-of-bounds
numbers, unsafe initial overlap and obstacle-covered starts fail before replacing
the active scene. Async imports cannot overwrite later edits. Rehearsal remains
independent of fleet plans, approvals, simulator commands and the PX4 adapter.

Centerline marker geometry is now a nominal 1 m display radius rather than the
old 5.5 m symbol that could visually overlap safe obstacle margins. It is explicitly
not an aircraft footprint. Original vector/PNG app identity and actual Windows
product/version metadata replace the generic Electron icon/metadata; packages
remain unsigned. The original vector and its reproducible browser-render script
are in the repo, with no remote assets or generative model dependency.

## Observed local evidence

- **66 Python tests passed**, **92.08% statement coverage**, unchanged 85% gate.
  Authorization, CSRF, exact origin/host, idempotency, persistence and desktop
  boundaries remain included. Ruff/format passed. One existing TestClient
  deprecation warning does not affect assertions.
- **46 TypeScript tests passed**, **100% statements/branches/functions/lines**
  across the measured pure geometry, rehearsal and scene-interchange modules.
  A hand-authored 100 m / 5 m/s scene independently takes 20 s and is at east
  −15 m at t=7 s. Fixed scenes round-trip; strict UTF-8/size/number/state rejection
  and separation geometry are covered. React/native DOM code is not included in
  that unit-coverage denominator.
- **12 actual Chromium/WebKit browser journeys passed**, including existing
  operator/viewer/review/cancel controls and new draft/apply, pause/scrub, real
  save/open downloads, invalid-file preservation, overlap rejection, unchanged
  command snapshots, keyboard-accessible controls, axe and 390px overflow checks.
  Test selectors were made explicit for the two distinct replay sliders; snapshot
  assertions now require successful authenticated reads instead of allowing
  undefined error-response fields to appear equal.
  Hosted Linux fonts exposed a real keyboard accessibility gap when the multi-aircraft
  position table overflowed horizontally. Its scroll container now has a named,
  focusable region; browser journeys explicitly focus it and verify horizontal
  arrow-key scrolling when overflow exists. The axe rule remains enabled.
- The actual **Windows packaged executable** passed first-account setup, animation,
  custom waypoint application, exact t=7 s replay, renderer isolation and persisted
  login across restart in an isolated data root. Product metadata was independently
  read as Drone Operations Console / 0.3.0.0.
- Production TypeScript/Vite build and bounded gzip policy passed. Existing
  mutation smoke caught **3/3** deliberate faults: removed obstacle margin,
  frozen motion and bypassed separation hold; original source was restored.
- Current npm/Python locked dependency audits reported **zero/no known
  vulnerabilities**; no suppressions or relaxed checks were added.

The local Windows Playwright Firefox runtime has an existing pre-page launch
failure; Linux Firefox remains a required hosted project. Native PostgreSQL,
non-root container, pinned genuine PX4 SIH and cross-platform Python checks run
in their existing hosted lanes; local Docker was left unchanged. Source/Actions
and generated declaration/file-map checks remain mandatory before publication.

## Limits

At most three friendly routes, eight waypoints each, eight obstacle disks, ±120 m
coordinates, 1–8 m/s speed and 180 s duration. Save/open accepts at most 32 KiB.
Grid failure and conservative global holds are explicit. These are civilian
cooperative 2D exercises, not targeting, pursuit/evasion, real flight dynamics,
operational authorization or certified collision avoidance. Source/release CI is
required after local verification; no local result is substituted for it.
