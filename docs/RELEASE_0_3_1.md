# Drone Operations Console 0.3.1

Jason Stys: completion-based Windows application lifetime and exact native resource
identity. Reusable scenes, projected routes, obstacles, cooperative rehearsals,
pause/scrub and authenticated replay retain their existing behavior.

## Corrected shutdown

The previous owner exited successfully after a fixed 15-second timer even when its
private Uvicorn service still had an active request. An actual isolated held-request
reproduction observed owner/child exit and a reset HTTP response before the explicit
release gate. This proves interrupted work; it does not prove an orphan remained.

Quit and window Close now request stdin EOF once and keep a visible "Finishing
current work" window until the known child actually closes. Repeated Quit/Close
does not bypass that wait. Unexpected/nonzero/signal/spawn/pipe failures are not
reported as successful completion. There is no new kill timer or blanket process
termination. A permanently stuck request can therefore require investigation while
the owner remains visible; do not force-close it and assume its work was saved.

## Delivery identity

Builds require clean coherent product 0.3.1 source and final Python 3.14.10 or a later
3.14 security patch. The native owner checks the recorded source/version, actual
service/Python DLL hashes and complete bounded UI inventory before opening its
private data. Readiness must match the random launch nonce, source and version.
Before appending its service log, the owner refuses directory aliases/junctions,
installed-program roots and linked/nonregular log or SQLite recovery files. The
opened log descriptor must still be an ordinary single-link matching file.
Hashes detect inconsistency within trusted installed resources; they do not defend
against an administrator replacing both code and its manifest, and are not signing.

The manual release workflow requires the current main push Validation and CodeQL
runs, actual source-bound processed CodeQL/SARIF and no open main scanning alerts.
A present aggregate check must also pass; main need not create a PR-only check.
It refuses an
existing tag or draft/published version and creates a new verified **draft** only
after native acceptance. Public publication and actual installer upgrade are separate
owner-reviewed steps. Failed/historical releases and accounts are not overwritten.
Checksums use a fresh version-specific local folder and exclusive file creation;
an earlier local delivery attempt is refused rather than replaced.

## Scope and upgrade

Windows x64 unsigned per-user installer. Existing accounts stay outside installed
files in the original OS-user data location; no account/schema migration is added.
Close the old application gracefully and independently back up its stopped private
workspace before upgrading. Keep OS protections enabled and verify exact published
SHA256SUMS. The automated native journey launches the packaged executable, not an
NSIS install transaction. This patch adds no Linux/macOS installer, live aircraft,
radio, hardware, targeting, real-flight dynamics or collision-avoidance certification.

Source tests and local candidate observations are recorded in the dated
[validation report](reports/native-lifetime-2026-11-11.md). Hosted checks, exact-source
draft assembly and delivery acceptance must pass before a new download is accepted.
