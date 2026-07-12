# Work Queue Production Migration v1.9

Status: `migration_review_required`

## Selected persistence

CornerOps will use PostgreSQL in the existing Supabase project, isolated in the private
`cornerops_internal` schema. CornerMex operational tables in `public` remain read-only and are not
referenced by the migration.

The runtime must connect with a dedicated login granted only the no-login group role
`cornerops_internal_runtime`. Do not use the publishable key, anon key, `service_role`, or the
CornerMex read-only key for internal writes.

## Preflight

1. Confirm Supabase project ID `nhxpujypqxbjiqqddxqt` and take a current platform backup.
2. Review `supabase/migrations/20260711190000_cornerops_internal_work_queue_v19.sql`.
3. Verify the SQL contains no `public.products`, orders, payments, customers, leads, or inventory.
4. Confirm it creates only `cornerops_internal` objects and the no-login role.
5. Apply through the Supabase migration API only after founder approval.
6. Run Supabase security and performance advisors.
7. Create a dedicated login outside source control and grant it `cornerops_internal_runtime`.
8. Store its connection URL only in Railway as `CORNEROPS_INTERNAL_DATABASE_URL`.
9. Enable `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED=true` only after connectivity validation.

## Verification

Confirm the three tables and indexes exist, anon/authenticated/service_role have no grants, the
runtime role cannot access `public`, and update/delete against `audit_events` fails. Then run one
internal sync, repeat it to confirm reuse, decide one test approval, and verify its append-only audit
events. No CornerMex entity may be used for mutation testing.

## Recovery

Disable `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED` and redeploy to fail closed. Preserve the schema for
forensics and recovery; do not truncate or drop tables during incident response.
