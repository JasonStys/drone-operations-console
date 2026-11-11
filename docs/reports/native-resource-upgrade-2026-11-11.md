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

## Clean Windows package checkpoint

At clean source `8109986e26e0952dc558c682f4e928f8ec3de287`, the patched3.14.10 frozen service and real
NSIS candidate built successfully. The actual package contains the exact `runtime/0.3.2/ui` and
`runtime/0.3.2/service` destinations selected by the loader. The installer SHA256 is
`5ab68d28630cb178467a562bee09bcf6c53dde7c930885bb400b80a394995ff5`.

All three real native tests passed: account/animation/sandbox/restart6.9s, copied-package mixed-old-
layout preservation/actual new GUI6.7s, and separately frozen held-work/repeated-Quit/PID proof19.8s.
The independent observer confirmed child exit0 at16.324s and owner exit0 at16.450s after the old15s
boundary, with no forced cleanup. No installed app or ordinary profile was used. The source suite
passed212 Python tests at92.13% against the original85% floor,73 Node tests at99.14% lines/98.50%
branches/100% functions against95/90/95, and46 UI utility tests at100%. Formatting, strict metadata,
source/file maps and public-source policy passed. Current hosted results and actual downloaded NSIS
upgrade acceptance remain separate; the existing failed0.3.1 draft is preserved.
