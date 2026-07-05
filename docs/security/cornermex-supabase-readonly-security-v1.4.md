# CornerMex Supabase Read-Only Security v1.4

v1.4 keeps CornerOps in a read-only, fail-closed posture for CornerMex Supabase.

## Guarantees

- Only `select` reads are exposed by `CornerMexSupabaseReadOnlyClient`.
- No `insert`, `update`, `delete`, `upsert`, or mutation `rpc` helpers are exposed.
- Service-role-like keys are flagged.
- `CORNERMEX_SUPABASE_ALLOW_WRITES=false` is required.
- `CORNERMEX_SUPABASE_READ_ONLY=true` is required.
- `CORNERMEX_SUPABASE_FAIL_CLOSED=true` is required.
- Row limit defaults to 50.
- Request timeout defaults to 8000 ms.
- PII masking is enabled by default.
- Reads are audited.

## Key Handling

Use only Supabase anon/publishable credentials. Do not use service role credentials in CornerOps, Railway, Lovable, GitHub, docs, PRs, screenshots, or Telegram.

The CLI checks report only booleans such as `anonKeyPresent`. They never print key values.

## RLS and Table Exposure

Migrations are evidence, not proof of live access. The backend reports table-level availability after safe selects:

- `available`
- `available_empty`
- `available_masked`
- `missing_table`
- `rls_blocked`
- `timeout`
- `error_sanitized`
- `config_missing`

If some tables work and some fail safely, the connector reports `real_read_only_partial`.

Supabase changelog checked on 2026-07-05. The relevant operational caveat is that exposed Data API access and RLS must both be verified; a table existing in SQL/migrations does not prove anon/publishable read access.

## Incident Response

If unsafe config is detected:

1. Remove the unsafe variable or key from Railway/local env.
2. Ensure `CORNERMEX_SUPABASE_ALLOW_WRITES=false`.
3. Ensure `CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true`.
4. Rotate any service role key that may have been pasted into an unsafe location.
5. Rerun `npm run cornermex:supabase-readonly-check`.

## Still Disabled

Supabase writes, Lovable mutations, GitHub writes, WhatsApp sends, external emails, customer channels, proactive outbound, native tools, and OpenClaw execution remain disabled.
