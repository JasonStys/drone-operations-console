# Processed main CodeQL delivery gate — 11 November 2026

By Jason Stys. A delivery-policy repair; application runtime, account data, model
behavior, version and previous release assets are unchanged.

## Actual failure

Accepted main `21c9e62763ecf29857c44736d1e7d174f9d58b7e` passed its nine
Validation jobs and CodeQL scanner. The first manual Windows-release attempt
[43005380047](https://github.com/JasonStys/drone-operations-console/actions/runs/43005380047)
then stopped in read-only preparation, before any native build, tag/draft or asset
write. The guard incorrectly required a separate check named `CodeQL`, which
GitHub supplied on the pull request but omitted on this actual main commit.
Its mocked provider had modeled the PR check layout rather than this main layout.

Successful workflow status alone also cannot establish complete analysis. Earlier
PR tests had four findings despite passing checks. The correction therefore does
not simply remove the requirement and assume zero findings.

## Corrected decision

The guard retains exact successful main-push Validation/CodeQL workflows, all ten
actual validation/scanner check names, current source identity, trusted manual-run
attribution, zero open main alerts and every existing release/tag/local-evidence
preservation rule. A separate aggregate is optional only when absent; if present,
it must be unique and successful. Unrelated failed or pending checks still block.

It additionally requires exactly one processed main analysis for the actual source,
CodeQL tool/version, `.github/workflows/codeql.yml:analyze` key/category, empty
error/warning strings, positive integer rules and zero integer results. The real
SARIF API media type must then agree on main branch, immutable commit, exact
repository URI, category, tool version and configured `security-and-quality` suite.
Both JavaScript and Python query packs must contain unique nonempty language-specific
rules whose total matches API metadata. Missing language packs, raw SARIF results,
wrong source/suite/ref, ambiguous scans or provider errors cannot become a pass.

The only active manual-run exception remains bound to its exact authenticated
workflow/run/check-suite; it does not waive other checks. Provider lists retain
their complete bounded-page contract. Unknown/changed analysis shapes require
review rather than a fallback to successful job labels.

## Actual API validation

The new verifier was used **read-only** against accepted main, without forging
release context or invoking draft mode. Processed analysis `2143041804` matched
the main source, ref, workflow key/category and CodeQL `2.27.4`: 373 rules comprised
201 JavaScript and 172 Python rules; metadata and raw SARIF each had zero results,
with empty errors and warnings. This count is observed evidence for that scan,
not a permanently hardcoded rule count or a percentage of source lines analyzed.

That real request also exposed a Windows transport fault: locale-default CP1252
could not decode Unicode in the SARIF rule descriptions. CLI output is now decoded
explicitly as strict UTF-8. A real subprocess emits non-ASCII JSON bytes to test
that transport; no replacement decoding or ignored error is used.

## Validation and limits

The focused gate suite includes the real main check layout with no PR aggregate,
successful optional aggregate, failure/pending/neutral/duplicate aggregate cases,
missing/stale/ambiguous analysis, wrong ref/key/category/tool, errors/warnings,
invalid counts, missing language, duplicate rules/packs, changed suite, raw results,
metadata/SARIF disagreement, provider failure and actual UTF-8 subprocess transport.
Existing source/version, own-run, other-check, no-overwrite and asset controls remain.

Local focused checks passed 91 tests; the complete Python suite passed 207 tests
with 92.13% statement coverage against the unchanged 85% floor. Lint, formatting,
navigation/privacy/pin and distribution-size gates passed. Exact new-head hosted
workflows must still pass before merging. The actual new main must then pass full
analysis and a real manual release
preflight; unit fixtures and the read-only old-main proof do not claim that future
upload succeeded. This repair does not publish, install, change runtime code or
modify accounts, Docker, hardware, source queries, exclusions or coverage floors.

CodeQL is one analysis tool, not a security certification. The reviewed combined
SARIF shape and a complete maximum of three 100-row provider pages are explicit
policy bounds; a future new language, provider shape or larger/ambiguous history
requires deliberate review. The existing unsigned Windows installer, packaged-
executable testing scope and trusted-OS-owner limitations remain unchanged.
