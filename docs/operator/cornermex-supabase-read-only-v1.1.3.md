# CornerMex Supabase Read-Only v1.1.3

v1.1.3 activates the safe path from `repo_discovered` to `real_read_only`.
Without Supabase credentials, CornerOps stays in `repo_discovered` and uses the
Lovable repo migration map for medium-confidence contracts.

## Required Supabase Values

Get these from the Supabase project connected to Lovable:

- Project URL: Supabase project settings, API section.
- Anon/publishable key: Supabase project settings, API section.

Do not use the service role key.

```env
CORNERMEX_SUPABASE_ENABLED=true
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
CORNERMEX_SUPABASE_SCHEMA=public
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_MAX_ROWS=100
CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS=10000
CORNERMEX_SUPABASE_AUDIT_READS=true
CORNERMEX_SUPABASE_PII_MASKING=true
CORNERMEX_SUPABASE_SCHEMA_DISCOVERY_ENABLED=false
CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED=true
```

## Check

```bash
npm run cornermex:supabase-read-only-check
```

Modes:

- `repo_discovered`: repo/migration map exists, Supabase URL/key missing.
- `real_read_only`: safe Supabase URL + anon key configured, writes blocked.
- `blocked_unsafe_config`: write flag, mutation flag or service-role-like key detected.

## Disable

```env
CORNERMEX_SUPABASE_ENABLED=false
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
```
