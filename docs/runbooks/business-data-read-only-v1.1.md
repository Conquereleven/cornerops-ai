# Business Data Read-Only Runbook v1.1

## Env

```env
CORNEROPS_BUSINESS_DATA_ENABLED=true
CORNEROPS_BUSINESS_DATA_MODE=read_only
CORNEROPS_BUSINESS_DATA_DRY_RUN=true
CORNEROPS_DB_READ_ONLY=true
CORNEROPS_DB_ALLOW_WRITES=false
CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED=false
CORNEROPS_DB_QUERY_TIMEOUT_MS=10000
CORNEROPS_DB_MAX_ROWS=100
CORNEROPS_DB_AUDIT_READS=true
CORNEROPS_DB_PII_MASKING=true
CORNEROPS_DATABASE_PROVIDER=supabase
SUPABASE_URL=<private-url>
SUPABASE_READONLY_KEY=<private-read-only-key>
SUPABASE_SCHEMA=public
```

## Test

```bash
npm run business-data:read-only-check
npm run demo:business-data-read-only
```

## Schema Discovery

Keep `CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED=false` by default. Enable only for explicit read-only schema inspection, then disable again.

## Verify No Writes

The readiness check must report `writesBlocked=true`, `piiMasking=true`, row limit enabled and schema discovery disabled by default.

## Disable

```bash
CORNEROPS_BUSINESS_DATA_ENABLED=false
CORNEROPS_DB_ALLOW_WRITES=false
```
