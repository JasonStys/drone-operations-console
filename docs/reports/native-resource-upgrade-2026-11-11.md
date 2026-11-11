# Versioned native resource validation 11 November 2026

Author: Jason Stys. The real old 0.3.0-to-new 0.3.1 NSIS attempt exposed a startup failure that fresh
packaged launches had not covered. The installed shared UI contained obsolete
`assets/index-CQbaKg54.js` alongside every current file. The complete inventory correctly refused
that mixed directory. The old program was backed up; ordinary profile data was not reset. The
failed 0.3.1 draft/installer evidence remains separate and must not be called an accepted upgrade.

## Correction

Product 0.3.2 uses `resources/runtime/${version}/{ui,service}` destinations and selects only the
actual validated app version at runtime. The loader checks a canonical three-component numeric
version before joining any resource path. There is no legacy-directory fallback and no deletion of
old/unknown resources. The complete current UI inventory, every digest, source/runtime/version and
private-path boundary remain unchanged. Build configuration refuses shared, stale, missing or
additional resource mappings before freezing.

The locked electron-builder 26.18.0 `FileMatcher` expands both `from` and `to` through its macro
expander, which resolves `version` from AppInfo. An actual installed-library contract test computes
the two output paths and compares them to the runtime selector; this is stronger than a copied
string assertion. Primary implementation:
[fileMatcher](https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/fileMatcher.ts)
and [macroExpander](https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/util/macroExpander.ts).
The exact locked implementation is also exercised locally and in source CI.

## Independent regressions

- Real files show the old shared layout fails when a stale hashed JS file is added. The same valid
  source/runtime/UI bytes in the new version validate while the stale old bytes remain unchanged.
- An extra file inside the active version still causes strict inventory refusal. Missing new
  resources fail; valid legacy copies cannot become a fallback. Traversal/newline/prerelease or
  noncanonical version inputs cannot select a resource directory.
- The actual compiled package is copied into one fresh test-owned directory. Complete active
  resources are also placed under the former layout and made stale, reproducing the old strict
  failure. The real new owner/service/UI then opens, provisions only a synthetic test account and
  shows the route rehearsal at the exact new source/version. Legacy files are compared byte-for-
  byte afterward and the owned temporary software is removed only after normal owner completion.
- Original real account/rehearsal/sandbox/restart and separately frozen held-work/repeated-Quit/PID
  assertions remain. No wait, status, coverage, query, inventory or sandbox check is weakened.

## Recorded checkpoints

The first local Node round passed 73 tests,99.14% lines,98.50% branches and 100% functions against
the original 95/90/95 floors. The focused Python version/source/release round passed 131 tests.
Real NTFS alias fixtures require the ordinary user token; the initial restricted-token EPERM is
an environment failure retained privately, not a skipped alias check. Full native/source/browser
and hosted results are recorded after those checks actually complete.

## Limits

This is a version-scoped packaged-resource repair, not an account/schema change. Unknown old files
are preserved and may still consume disk space; they are never adopted as current resources. The
copied-package test is equivalent resource-selection proof, not an NSIS install/upgrade transaction.
Actual downloaded installer acceptance and old-account compatibility remain separate. The app is
an unsigned Windows cooperative simulator; no live aircraft, hardware or operational targeting is
introduced. Historical 0.3.0/0.3.1 source and failed delivery observations retain their own identities.
