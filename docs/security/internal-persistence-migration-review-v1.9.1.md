# Internal Persistence Migration Review v1.9.1

## Decision

`approved_for_application`

Reviewed migration: `20260711190000_cornerops_internal_work_queue_v19.sql`.

## Security findings

- The private `cornerops_internal` schema revokes access from `public`, `anon`, `authenticated`, and `service_role`.
- The group role is `NOLOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS`, and `NOINHERIT`.
- Runtime grants are limited to select/insert/update on work items and approvals, and select/insert on audit events.
- Deletes are denied. Audit updates and deletes are denied and additionally blocked by a trigger.
- A partial unique index enforces one pending approval per work item. A full foreign-key index supports approval joins and parent checks.
- Work item idempotency is enforced by a unique key. Optimistic concurrency is enforced by the application version predicate.
- The migration is transactional and idempotent. It does not modify `public`, business tables, RLS policies, storage, auth, or existing data.

## Runtime review

- Production fails closed when persistence is enabled without a connection string.
- The PostgreSQL adapter uses a bounded pool of five connections, an 8-second connection/statement timeout, parameterized values, and SSL outside localhost.
- The application write boundary accepts only the three internal tables.
- The restricted login is provisioned separately so no password is stored in migration history or Git.

## Residual risks

- Supabase reports RLS disabled on historical table `public.products_backup_pre_intermex_import`. This predates v1.9.1 and is not changed automatically because enabling RLS without a policy could break intended access.
- Database owners and Supabase administrators can bypass runtime restrictions by design; the application login cannot.
- Rollback uses the feature flag. Tables and audit evidence must be preserved.
