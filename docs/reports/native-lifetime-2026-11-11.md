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

## Later clean candidate acceptance

A clean candidate at source `38672b9412b03b73e80ffa96c5206d867ee04485` was then
frozen with final Python 3.14.10 and packaged as an unsigned NSIS installer.
The 144,467,171-byte **local candidate** installer SHA-256 was
`63c57abaa75f60ec68cdf801967740c633e5aae28dac996408a55220e5326caf`.
This is not a digest for a published or installed new release.

The actual packaged product passed private account creation, effective renderer
sandbox/isolation, moving routes, editable scene/scrub, matching source/version/UI
and login after restart in 5.7 seconds. A separate QA frozen service with the exact
product owner/UI passed the held-work journey in 21.0 seconds. Repeated Quit and
Close retained the visible waiting owner beyond the former timer, then explicit
release produced HTTP 200 and the real service-finally marker. The independent
child handle observed exit 0 after 16.697 seconds; the owner exited 0 after
16.792 seconds. No force cleanup or normal/installed profile was used.

The product's frozen Python DLL matched the actual patched SDK byte-for-byte:
`d8a06cc6ca3348925ea29e343e1c5c5895fe0bb433ff913e1cee44caf358aa6a`.
Its manifest records clean source, product version, complete UI inventory and
actual service/Python DLL hashes. Later delivery-helper/report changes do not
retroactively change this candidate's source identity. Exact latest-head/main
hosted builds remain mandatory before new delivery.

After the delivery-helper controls were finalized, the full source suite passed
169 Python tests with 92.13% combined statement coverage, retaining the original
85% minimum and explicit native-entry denominator described above.

All 18 existing journeys across Chromium, Firefox and WebKit passed, including
roles, accessibility/responsive controls, scene errors and actual JSON interchange.
All three deliberate geometry/motion/hold faults were detected and original source
restored. Locked npm and Windows packaging dependency advisory checks reported no
known vulnerabilities at this dated check; that is not a future vulnerability guarantee.

The draft gate excludes only its authenticated active manual run/check-suite,
whose workflow, source, main ref and in-progress state must match. It still requires
every push validation and aggregate CodeQL check and refuses unrelated failures.
Release notes bind the report to the accepted immutable source rather than a
release-page-relative URL. Versioned local checksum/note files use exclusive
creation, preserving earlier delivery evidence. Mock-provider cases validate these
decisions, not actual hosted upload success. No release was dispatched, published
or installed as part of this source checkpoint.

The first PR validation at `8fc2fd6f1d7f2f667fdec9444f28cc4245e416b7` exposed
a macOS fixture-location problem: the OS temporary directory uses the system
`/var` alias, so the intentional lexical-ancestor refusal happened before the
member-specific tests. Those failures also reduced measured coverage; neither
was accepted as a passing result. The fixture now canonicalizes only its known
OS temporary base before creating its own directories and checking cleanup scope.
Production user-supplied paths are never canonicalized into acceptance, and the
actual deliberate ancestor/final aliases remain required refusal cases on every
OS. Test counts, assertions and coverage minimums are unchanged. The original
failed hosted log is retained; fresh exact-head checks remain required.

All 11 corrected-head checks then passed at
`ac4f3b407ce4e19021135e27ccf55bfa71f4fcec`, including native Windows and genuine
Linux PX4. An additional PR-ref alert API audit nevertheless found four open
findings: one mixed `ctypes` import-style note and three file-data-to-outbound-HTTP
warnings in the QA held-work harness. Passing workflow/aggregate status alone
was therefore not treated as zero alerts or release clearance.

The QA harness now requests held work through the actual Electron renderer,
letting the unchanged native header hook supply its launch capability. No launch
token is written to a ready file or copied from file data into outbound requests.
Separate explicit owned file gates release held work and acknowledge the actual
HTTP response before the QA child finalizes, avoiding a race where destroying
the renderer could hide its successful response. Nonce equality remains an
assertion, and the actual handler, 16-second boundary, repeated Close/Quit,
HTTP 200, finalization marker and independent process-handle checks remain.
The separate control HTTP listener is removed; the shipping product has no QA
route or additional gate. The observer uses one qualified `ctypes.wintypes`
import. No query suppression, alert dismissal, retry, coverage-floor change or
production-runtime change implements these corrections; new hosted scans and
actual frozen acceptance remain required before claiming resolution.

## Limits

Windows-only unsigned packaging; packaged executable launch is not a clean NSIS
installation or uninstall transaction. Resource manifests assume a trusted local
program directory and are not cryptographic signatures. Database contents remain
protected by OS-user permissions, not inaccessible to that user/administrator.
There is no forced shutdown deadline; indefinitely stuck work retains ownership
and requires investigation. The QA request is synthetic and does not establish
every Windows crash/power-loss recovery outcome or real drone/hardware safety.
