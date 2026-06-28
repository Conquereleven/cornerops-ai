# CornerMex Supabase Real Read-Only v1.1.3

v1.1.3 prepares CornerMex for Supabase `real_read_only` without requiring credentials for tests.

## Required Founder Config

```env
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
CORNERMEX_SUPABASE_SCHEMA=public
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_BLOCK_MUTATIONS=true
```

Use anon/publishable read-only credentials. Do not use a service role key.

## Commands

```bash
npm run cornermex:supabase-read-only-check
npm run demo:cornermex-schema-discovery
npm run demo:cornermex-supabase-read-only
npm run demo:v1.1.3
```

## Modes

- `schema_discovered`: schema evidence found in repo migrations/generated types, no live data.
- `real_read_only`: Supabase URL and anon/read-only key configured with write flags blocked.
- `blocked_unsafe_config`: write flags enabled, mutation block disabled, or service-role-like key detected.

## Remains Disabled

Production writes, Lovable mutations, Supabase mutations, GitHub writes, WhatsApp/customer sends, external emails, native tools, ClawHub execution and Telegram v1.2.
