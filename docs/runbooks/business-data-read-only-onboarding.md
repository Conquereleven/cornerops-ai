# Business Data Read-Only Onboarding

## Configure

Prefer staging or a read replica. Create a DB principal that has SELECT and necessary metadata permissions only. For Supabase, configure `SUPABASE_URL`, `SUPABASE_READONLY_KEY`, schema and provider. For Postgres, configure `READONLY_DATABASE_URL`; a vetted query executor/driver is still required before real Postgres activation.

```env
CORNEROPS_BUSINESS_DATA_ENABLED=true
CORNEROPS_BUSINESS_DATA_MODE=read_only
CORNEROPS_BUSINESS_DATA_DRY_RUN=true
CORNEROPS_DATABASE_PROVIDER=supabase
SUPABASE_SCHEMA=public
CORNEROPS_DB_READ_ONLY=true
CORNEROPS_DB_ALLOW_WRITES=false
CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED=true
```

Never set `SUPABASE_READONLY_KEY` to the service-role key.

## Verify

1. At the database boundary, prove SELECT succeeds.
2. Prove INSERT, UPDATE, DELETE, DROP and ALTER fail for the credential.
3. Run `npm run control:tower:beta`; expect real request to remain degraded until all gates pass.
4. Inspect `/api/control-tower/schema-discovery` and `/api/control-tower/data-contracts`.
5. Confirm required mappings are high confidence and samples contain masked PII.
6. Inspect audit logs for `database_read`, `schema_discovery` and `business_data_read`.
7. Set `CORNEROPS_BUSINESS_DATA_DRY_RUN=false` only in the controlled beta environment and rerun QA/demos.

## Disable

Set `CORNEROPS_BUSINESS_DATA_ENABLED=false`, remove the read-only secret, restart, and confirm source mode is `mock`. Do not run migrations or cleanup queries.
