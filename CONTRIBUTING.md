# Contributing

Preserve the simulator-only boundary, exact-target authority checks and unknown
outcomes. Do not add serial/remote-aircraft endpoints, targeting, tracking of people,
automatic command retries or unaudited user-code execution. New adapters require
independently authored native acceptance, not mocks labeled as hardware testing.

Use descriptive names and small cohesive modules; validate units, finite numbers,
counts, time, revisions and ownership at boundaries. Keep complexity explicit and
measure performance before optimizing. Add regression oracles before changing a
failure contract. Keep headers/docstrings useful; regenerate exact declaration maps
with `python tools/docs_index.py` after formatting. Never hand-edit locked hashes.

Run the README quality sequence; review source/public-data diffs before publishing.
Dependencies are pinned and locked: pip-tools 7.6.2 generates Python SHA-256 locks,
and npm generates `package-lock.json`. Inspect changes and audit before committing.
No Actions evidence or caches are uploaded by default. Storage cleanup requires
fresh owner approval; do not delete runs to hide failed development attempts.
