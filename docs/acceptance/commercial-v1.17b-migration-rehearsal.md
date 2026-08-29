# Commercial migration rehearsal v1.17B

Status: `VERIFIED_DISPOSABLE_POSTGRES_ONLY`

Date: 2026-08-09

PostgreSQL: 17.10 (Homebrew)

Migration: `20260722010000_cornerops_commercial_operations_v117a.sql`

SHA-256: `44cee38fe62e540b7bb12fea27ece4e424e448678ce47c497c268faeacd36705`

The rehearsal used an isolated cluster under `/private/tmp` and never connected to Supabase or
production. The Work Queue v1.9 migration supplied the existing private schema/runtime-role
baseline; the exact commercial migration then applied cleanly.

Verified evidence:

- Three commercial tables, five focused indexes, one trigger function and four non-internal
  append-only triggers were present.
- `cornerops_internal_runtime` had `SELECT/INSERT/UPDATE` on mutable commercial entities and only
  `SELECT/INSERT` on transition events and the evidence registry.
- A rolled-back runtime transaction inserted an account entity and transition event successfully.
- Runtime `UPDATE`, `DELETE`, and `TRUNCATE` were absent on immutable evidence tables.
- Owner-level `UPDATE`, `DELETE`, and `TRUNCATE` probes on both immutable tables failed closed with
  SQLSTATE `42501` and preserved row counts.
- `public`, `anon`, `authenticated`, and `service_role` had no private-schema/table access.
- Concurrent identical COD remittance created one evidence fact and one settled payment.
- Evidence fingerprints rejected replay/conflict through the existing PostgreSQL integration test.
- A custom-format backup restored into a second disposable database with all three tables, one
  evidence row, three transitions and four triggers.
- Rollback dropped triggers first, dependent transition/evidence tables next, the entity table,
  then the function. Zero commercial tables/functions remained while all three Work Queue tables
  remained.

Both databases, the cluster, log and dump were destroyed after verification. No production
migration or write occurred.
