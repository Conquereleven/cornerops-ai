# SupplyGraph data boundary and migration review v1.10

## Boundary

- All five tables are in private schema `cornerops_internal`.
- Runtime uses the existing restricted PostgreSQL login and pool.
- `public`, `anon`, `authenticated` and `service_role` receive no table privileges.
- Runtime receives SELECT/INSERT/UPDATE only where required; no table permits runtime DELETE.
- Offer snapshots permit SELECT/INSERT only and have a database trigger rejecting UPDATE/DELETE.
- No public CornerMex business table is referenced by the migration or runtime store.
- Audit metadata is sanitized and excludes request bodies, credentials and contact details.

## Principal migration review

- Migration: `20260712220000_supplygraph_data_foundation_v110.sql`
- SHA-256: `bc9f1968fe7fc2883f2353a0b2b5a8f5b64ea0a2badfcf4ac8ff9f6c6f9fdcec`
- Schema isolation: pass
- Destructive DDL/DML: none
- Foreign keys and uniqueness: pass
- Partial unique active item key: pass
- Append-only offer enforcement: pass
- Query indexes: pass
- Runtime role inheritance compatibility: pass
- Default privilege revocation: pass
- Rollback model: feature disablement; data preserved
- Decision: `approved_for_application`

The first performance-advisor run identified one redundant index: the explicit canonical lookup index
duplicated the unique-constraint index on `canonical_key`. Remediation migration
`20260713010500_supplygraph_remove_duplicate_index_v110.sql` drops only that redundant index and leaves
the unique constraint intact. Its SHA-256 is
`c2f566c09dbddaeb39e3f74c060994d9ada5c0624ecbe5a44278998f0a21e451`. No table or data is removed.

## Authentication and execution

Reads require the operator token. Mutations require both operator and Founder Action tokens. Origin,
content type and rate limits reuse the existing middleware. Founder-only and operator-only mutation
attempts fail closed. SupplyGraph has no external send, supplier contact, purchase, product activation,
service-role or OpenClaw path.

## Production least-privilege proof

The real restricted login passed 14 allowed SELECT/INSERT/UPDATE probes and rejected 19 forbidden
operations, including all SupplyGraph deletes, offer UPDATE/DELETE, schema/object creation, public
business reads/writes, ALTER SCHEMA, CREATE ROLE, privilege grant effect and auth administration.
`public.payments` does not exist. All probes ran inside a transaction that was rolled back; zero probe
rows and zero PUBLIC schema ACL entries remained. Supabase security advisors reported no SupplyGraph
finding. Preexisting public-schema findings remain outside this isolated activation and were not changed.
