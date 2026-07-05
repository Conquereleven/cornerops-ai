# CornerMex Supabase Read-Only v1.4

v1.4 hardens the path from CornerMex repo discovery to real Supabase read-only data.

Current local status:

- Connector mode: `repo_discovered`
- v1.4 activation status: `blocked_by_missing_supabase_readonly_config`
- Supabase status: `not_configured`
- Missing config: `CORNERMEX_SUPABASE_ENABLED=true`, `CORNERMEX_SUPABASE_URL`, `CORNERMEX_SUPABASE_ANON_KEY`
- Writes: blocked
- External sends: blocked
- PII masking: enabled

## Strict Activation Rule

CornerOps must never claim `real_read_only` from environment variables alone.

Valid modes:

- `repo_discovered`: Lovable-connected repo/migrations are known, but no live Supabase select has succeeded.
- `real_read_only`: all mapped tables are readable through safe Supabase `select` calls.
- `real_read_only_partial`: at least one mapped table is readable and at least one mapped table is missing, blocked by RLS, timed out, or failed safely.
- `blocked_unsafe_config`: writes are enabled, read-only flags are disabled, fail-closed is disabled, or a service-role-like key is detected.

## Commands

```bash
npm run cornermex:supabase-readonly-check
npm run demo:cornermex-real-readonly
npm run demo:v1.4
```

All commands run without credentials. Without Supabase URL/key, they report the blocked missing-config state and use mock/repo-discovered data only.

## Required Env

```env
CORNERMEX_SUPABASE_ENABLED=true
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true
CORNERMEX_SUPABASE_MAX_ROWS=50
CORNERMEX_SUPABASE_REQUEST_TIMEOUT_MS=8000
CORNERMEX_SUPABASE_MASK_PII=true
CORNERMEX_SUPABASE_FAIL_CLOSED=true
```

Optional mappings:

```env
CORNERMEX_SUPABASE_PRODUCTS_TABLE=products
CORNERMEX_SUPABASE_LEADS_TABLE=b2b_leads
CORNERMEX_SUPABASE_QUOTES_TABLE=b2b_leads
CORNERMEX_SUPABASE_ORDERS_TABLE=orders
CORNERMEX_SUPABASE_CUSTOMERS_TABLE=profiles
CORNERMEX_SUPABASE_PAYMENTS_TABLE=orders
CORNERMEX_SUPABASE_FULFILLMENT_TABLE=orders
```

## Table Status

- `available`: select succeeded and rows were returned.
- `available_empty`: select succeeded and the table was empty.
- `available_masked`: select succeeded and returned rows were PII-masked.
- `missing_table`: table is not exposed, missing, or not in the API schema cache.
- `rls_blocked`: RLS or permissions blocked the read.
- `timeout`: read timed out safely.
- `error_sanitized`: read failed and the error was sanitized.
- `config_missing`: Supabase URL/key/enabled config is missing.

## Notes

Supabase table exposure and RLS must be verified before activation. A table may exist in migrations but still be unavailable to the Data API or anon key. That is reported as table availability, not treated as proof of live read-only access.
