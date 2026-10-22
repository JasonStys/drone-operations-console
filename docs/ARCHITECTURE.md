# Architecture and decision record

Status: accepted for the prototype implementation, not production authorization.
Author: Jason Stys. Design/implementation is AI-assisted; this is not a claim of an
independent human security audit or certified flight-software review.

## Requirements and data flow

```text
React editor / grid / replay
          │ same-origin authenticated JSON
          ▼
FastAPI → role + CSRF → exact target/revision + safety gate
          │                          │
          ▼                          ▼
SQL missions/approvals      durable pending intent → selected adapter
commands/audit/observations                    ├─ synthetic replay (default)
                                             └─ native MAVSDK → owned PX4 SIH
```

R1 fleet/units/freshness: `domain`, `replay`, `px4`, UI. R2 editing/conflicts: `Plan`
and `Operations.save_plan`. R3 attestation/authority: `auth`, `approve`. R4 command
reliability: `Operations.command`, SQL unique `(actor,key)`. R5 bounded replay and
private exports: `store`, API. R6 genuine integration: native acceptance. R7 usable
and accessible interface: browser tests. R8 delivery: container/PostgreSQL/cloud
reference. Test files map these contracts to executable oracles.

## ADR-001: typed browser + Python authority + SQL

Context: an understandable single-workspace lab, real drone SDK integration,
cross-platform local replay and no cloud dependency to reach first success.

Decision: React/TypeScript for browser interactions; Python/FastAPI for validated
contracts and asynchronous native SDK calls; SQLAlchemy bound SQL with SQLite
locally and actual PostgreSQL verification. Native C++ is provided by the reviewed
MAVSDK package, not duplicated in a new hand-written flight stack.

Alternatives: a TypeScript-only backend simplifies toolchains but adds an SDK
boundary; a custom C++ web service duplicates mature web/auth infrastructure.
PostgreSQL-only local setup adds friction; SQLite is sufficient for one service
but is not evidence of PostgreSQL behavior, hence its separate native CI gate.

Consequences: two language toolchains and independently validated interfaces;
Python's synchronous small SQL operations can briefly block the event loop. This
bounded prototype does not claim high-throughput control. Revisit async persistence
and an authenticated edge broker only after measurements and threat review.

## ADR-002: simulator-only, selected at startup

Replay is a logical teaching animation. Native mode launches only the fixed Linux
SIH build from pinned PX4 source, binds the SDK to loopback, requires system ID 1
and refuses an ambiguous fleet. There is no UI-supplied endpoint or hardware driver.
Use separate databases for the two modes. Missing native setup fails startup.
The local OS and installed tools remain trusted, not attested by source hashes.

## ADR-003: durable intent is not exactly-once physical execution

One process serializes operations and reserves an `(actor,key)` before dispatch.
Same-key/different-intent requests conflict. Revision and service-boot identifiers
bind successful uploads. A timeout/transport failure is unknown, not success; a
restart recovers pending effects without resending. The controller never promises
exactly-once aircraft action or equates acknowledgement with motion.

Only the same actor's current ten-minute attestation permits upload/start. Holds
and returns still need a fresh link and valid sample but are not blocked by low
reserve. Armed edits/uploads are refused. Revisit authority leases, durable workers,
transactional outbox and actuator reconciliation before multi-process operation.

## Complexity and limits

For fleet F (3 replay or 1 native), plan W (2–12) and history H (300/aircraft): plan
validation/projection is O(W), fleet composition O(F), bounded evidence output
O(F + C + A), with at most 100 recent commands/audit events. Observation pruning
uses indexed integer IDs and a bounded retained set; SQL planner/storage costs are
database-dependent, not falsely described as constant time. Idempotency lookup has
a unique composite index. Native flight dynamics and SDK costs are external.

The SQL audit/command ledger grows on disk for review; API output is bounded, not
an automatic archival/deletion policy. One replica/process is supported. Browser
polling is 1 Hz, with at most one active poll per page and no command retry queue.
