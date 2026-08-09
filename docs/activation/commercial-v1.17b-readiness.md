# Commercial activation readiness v1.17B

This is a non-activating decision package. Missing evidence is not a pass.

| Gate | State | Evidence / blocker |
|---|---|---|
| Code readiness | VERIFIED | Dedicated `/api/ready` semantics and focused tests cover disabled, ready, unavailable and sanitized failure states. |
| Database readiness | VERIFIED | PostgreSQL 17.10 disposable apply, grants, forbidden mutations, replay, duplicate settlement, backup/restore and rollback passed. Production remains unmigrated. |
| Data readiness | VERIFIED | Candidate validates as `COMMERCIAL_PRODUCTION_CANDIDATE_NOT_IMPORTED`: 10 accounts, 12 SKUs, checksum pinned. Unknown commercial facts remain explicit. |
| Operational readiness | NOT_VERIFIED | Shipping amounts, COD destination eligibility, owners, MOQ and service levels need Founder/business evidence. |
| Security readiness | VERIFIED | Private schema boundary, append-only evidence, restricted runtime grants and no public Supabase-role access verified locally. |
| Rollback readiness | VERIFIED | Deterministic dependency order and backup/restore rehearsal completed locally. |
| Canary readiness | AUTHOR_REPORTED | Two-account/three-SKU manifest exists, but import and activation are not authorized. |
| Production authorization | NOT_AUTHORIZED | No migration, Railway change, activation, import, contact or external action is authorized in CO-1.17B. |

## Decision scope

| Decision | Disposition |
|---|---|
| MIGRATION_ONLY | READY_FOR_FOUNDER_DECISION |
| CANARY_IMPORT | NOT_AUTHORIZED |
| INTERNAL_ACTIVATION | NOT_AUTHORIZED |
| EXTERNAL_COMMERCIAL_USE | BLOCKED |

Before a migration-only decision, independent review must verify the exact migration hash, runtime
grants, owner-level immutable triggers and rollback order. After any separately authorized
migration, `/api/ready` must remain HTTP 200 with mode `commercial_inactive` until another Founder
authorization changes the feature flag.

`pnpm`: `VERIFIED_AVAILABLE_NOT_ADOPTED`. npm remains the repository package manager.
