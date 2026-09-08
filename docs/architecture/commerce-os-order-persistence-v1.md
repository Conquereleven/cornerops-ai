# Commerce OS order persistence v1

## Decision

Persist the latest canonical order revision in a tenant-scoped current-state table and append every
intake outcome to a separate immutable event ledger. Both live in the private
`cornerops_internal` schema; they are not exposed through the Supabase Data API.

## Isolation and concurrency

- Every read and write carries `tenant_id` explicitly.
- RLS is enabled and forced, with policies bound to the transaction-local
  `app.current_tenant_id` setting for the runtime role.
- Composite indexes follow the dashboard access paths: tenant + status + receipt time and tenant +
  source + source update time.
- A transaction-scoped advisory lock on the stable source key serializes concurrent first delivery,
  replay and revision without holding locks during external calls.
- The application transaction writes current state, the immutable ledger event and the existing
  sanitized audit event atomically.

The database constraints permanently block external-write, payment-capture and customer-message
flags from becoming true in this intake boundary.

## Supabase posture

Current Supabase projects no longer guarantee that new public tables are automatically exposed to
the Data API. This design does not opt in: public, anonymous, authenticated and service roles have
no access. The dedicated internal runtime role receives only the minimum table and sequence
privileges required by the service.

## Verification

The migration was created with Supabase CLI, applied twice to disposable PostgreSQL 17 and tested
for create, idempotent replay, monotonic revision, simultaneous duplicate delivery, audit
atomicity, cross-tenant RLS isolation and immutable-event mutation rejection.
