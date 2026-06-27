# CornerMex Supabase Read-Only Discovery v1.1.2

## Status

- Supabase config default: missing
- Current source mode without credentials: `mock`
- Candidate mode with anon/read-only config: `real_read_only`
- Schema discovery default: disabled

## Required variables

```env
CORNERMEX_SUPABASE_ENABLED=true
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
CORNERMEX_SUPABASE_SCHEMA=public
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_SCHEMA_DISCOVERY_ENABLED=false
CORNERMEX_SUPABASE_MAX_ROWS=100
CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS=10000
```

## Read-only rules

- Use anon/read-only key only.
- Do not use service-role keys.
- Do not run migrations.
- Do not call insert/update/delete/upsert/rpc mutation paths.
- Keep max rows and query timeout enforced.
- Keep PII masking and audit reads enabled.

## Confidence

- Missing Supabase config: low.
- Supabase configured but schema discovery off: medium.
- Supabase read-only schema discovered and mapped: high.

## Next steps

Provide Supabase URL and anon/read-only key in a private environment, then run:

```bash
npm run cornermex:lovable-config-check
npm run demo:v1.1.2
```
