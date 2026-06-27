# CornerMex Supabase Read-Only Runbook v1.1.2

## Goal

Prepare Supabase as a real read-only source for CornerMex without enabling writes.

## Required posture

- `CORNERMEX_SUPABASE_READ_ONLY=true`
- `CORNERMEX_SUPABASE_ALLOW_WRITES=false`
- `CORNERMEX_SUPABASE_SCHEMA_DISCOVERY_ENABLED=false` unless explicitly validating schema
- `CORNERMEX_SUPABASE_MAX_ROWS=100`
- `CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS=10000`
- PII masking enabled
- Audit reads enabled

## Key type

Use anon/read-only key only. Do not use service-role key.

## Verify

```bash
npm run cornermex:lovable-config-check
npm run demo:v1.1.2
```

## Disable

Set:

```env
CORNERMEX_SUPABASE_ENABLED=false
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
```

Then rerun the config check and verify mode falls back safely.
