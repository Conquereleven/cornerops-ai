# Commercial Operations Migration v1.17A

Status: `PROPOSED_NOT_APPLIED`.

The migration `20260722010000_cornerops_commercial_operations_v117a.sql` is private to
`cornerops_internal`. It adds a versioned commercial entity store and append-only transition
evidence. It does not read or write CornerMex tables and grants no access to public Supabase roles.
The transition table fails closed when external Intermex/carrier fulfillment states or settled
payment states lack attributable evidence metadata. The SQL remains review-only and unapplied.
Immutable transition history and the evidence registry reject `UPDATE`, `DELETE`, and statement-level
`TRUNCATE`, including accidental owner execution. Runtime grants remain `SELECT/INSERT` only for
these tables; this defense-in-depth change grants no additional access.

Review checksum: `44cee38fe62e540b7bb12fea27ece4e424e448678ce47c497c268faeacd36705`.

## Forward

1. Review SQL checksum and exact grants.
2. Apply only under a separate Founder-approved database change.
3. Introspect grants and run rolled-back forbidden-operation probes.
4. Enable `CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED` only after schema verification.

## Rollback

Disable `CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED` first. Preserve/export audit evidence, then under
separate approval drop the two commercial tables, trigger and function. Never roll back by deleting
individual transition records.
