# Native lifetime and resource identity — 2026-11-11

Jason Stys: actual owned-process reproduction, completion-based repair, failure
oracles and pending exact-source Windows package/release gates.

## Observed defect and independent repair evidence

The previous desktop owner at source `9b4c6feb7e0bc42418f9a1e7a0b64e38f43df26a`
used a 15-second successful exit timer. A separate QA frozen entry wrapped the real
`console.desktop` factory and pinned Uvicorn 0.54.0 with an explicitly held HTTP
operation. An independent Win32 process handle watched the known service PID.
The actual owner exited 0 at 15.139 seconds and the child exited 0 at 15.141 seconds;
the held response reset, its release gate had never opened and the service-finally
marker was missing. The observation establishes aborted work, not an orphan or a
proved Windows mechanism for child termination.

With the completion-based owner and the **same baseline held-service bytes**, the
request remained active beyond 16 seconds; repeated Quit and window Close retained
one visible waiting owner. Explicit release completed HTTP 200, the service-finally
marker, actual child exit 0 and owner exit 0 after 16.824 seconds, with no forced
cleanup. This is composition evidence, not a claim that a later full product
installer has already passed. Original failed harness attempts were retained
privately rather than relabeled as application passes.

## Implemented behavior and verification

- `desktop/owned-lifetime.cjs` makes startup, attachment, EOF, repeated stop,
  failure and actual child close explicit. 15 event-order cases cover pending
  startup, repeated requests, delayed attachment, spawn failure, failed pipe,
  child exit 7/signal and successful intended EPIPE completion.
- `desktop/resources.cjs` verifies exact product/source/version/schema, patched
  Python floor and complete bounded UI/service/DLL identities before private
  data opens. 33 real-file cases include tampering, missing/extra/unsafe fields,
  root/member junctions, empty-directory/depth/count budgets, prototype-shaped
  names, real descriptor growth/truncation and interrupted-read closure.
- 48 Node cases passed with 99.56% lines, 98.91% branches and 100% functions over
  those two modules, above new 95/90/95 minimums. The Windows junction fixture
  first failed under the restricted sandbox with EPERM; the unchanged test
  passed with normal Windows permissions. No skip or synthetic alias replaced it.
- An additional real-file reproduction established that the old append-open log
  sequence changed a hardlinked inert sentinel. The new private-directory admission
  refuses actual ancestor/final junctions, installed roots, linked log/SQLite recovery
  members and late hardlinks/replacement. All 62 cases across the three native modules
  passed with 99.08% lines, 98.41% branches and 100% functions, retaining the same
  95/90/95 floors. Unexpected negative-oracle descriptors are closed even when a
  refusal regresses. These checks concern trusted-owner path mistakes; they do not
  establish atomic namespace security against a hostile concurrent OS administrator.
- 46 existing pure frontend tests passed with 100% of their stated utility
  denominator. The complete React UI is separately exercised through real browser
  journeys; this score is not whole-application coverage.
- Python identity/build-source and delivery-contract cases use real bounded files
  and explicit provider fixtures. Provider fixture decisions are unit evidence,
  not proof of an actual hosted API/main scan or release upload.
- The full Python suite passed 166 tests with 92.13% combined statement coverage
  against the unchanged 85% minimum. This denominator includes the native entry
  module, which has 0% unit coverage and is exercised separately by native tests;
  the new identity reader has 100% unit coverage. A restricted-sandbox full-suite
  attempt produced no completed result and was stopped; normal-user execution
  passed without changing tests. One upstream Starlette/httpx deprecation warning
  remains; it is not relabeled as a failing test or hidden.

The repository-native held-work regression freezes a **separate QA-only** service
with a control listener, copying exact product owner/UI bytes and retaining the real
factory, launch capability and Uvicorn lifecycle. Its held route never enters the
shipping service. The ordinary packaged-account/rehearsal/restart journey remains
required, along with matching health source/version, visible UI version and renderer
sandbox/isolation. Actual child completion uses an opened process handle, not PID
absence or the owner's reported exit alone. The 16-second hold crosses the measured
former timer boundary; no setup retries or relaxed runtime deadline were introduced.

## Delivery gates and remaining acceptance

Current implementation requires a clean source commit before either service build;
the build binds final Python 3.14.10+ within 3.14, exact UI inventory and actual SDK DLL
bytes. Normal validation retains Core on four OS/Python lanes, three real browser
engines, genuine managed Linux PX4, PostgreSQL concurrency, container/Bicep and
CodeQL gates. Docker/PX4 are not run or repaired on this PC. Default workflows do
not upload full installer/service binaries to Actions storage.

Manual trusted-main delivery additionally checks the exact current Validation and
CodeQL push runs, aggregate CodeQL success, every required check and zero open main
alerts. Existing tag/draft/published identities are refused. Only a fresh draft with
exact installer/checksum provider digests is assembled; this script does not publish.

At this report's first source checkpoint, final clean-source product freeze,
full packaged/native held-work acceptance, hosted aggregate checks, new draft and
actual PC installer upgrade remain pending. Do not infer public release readiness
from local unit tests or baseline composition evidence. Existing 0.3.0 accounts,
installer, source evidence and installed files remain unchanged by this source work.

## Limits

Windows-only unsigned packaging; packaged executable launch is not a clean NSIS
installation or uninstall transaction. Resource manifests assume a trusted local
program directory and are not cryptographic signatures. Database contents remain
protected by OS-user permissions, not inaccessible to that user/administrator.
There is no forced shutdown deadline; indefinitely stuck work retains ownership
and requires investigation. The QA request is synthetic and does not establish
every Windows crash/power-loss recovery outcome or real drone/hardware safety.
