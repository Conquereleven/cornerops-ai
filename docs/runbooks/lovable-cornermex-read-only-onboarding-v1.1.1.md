# Lovable CornerMex Read-Only Onboarding v1.1.1

## What the founder must provide

- Lovable project URL or project name.
- Connected GitHub repo URL/name.
- Supabase URL.
- Supabase anon/read-only key.
- Supabase schema and table names, if known.
- Lovable project `.env.example`, if available.
- Deployment URL, if available.

## Environment variables

```env
CORNERMEX_LOVABLE_ENABLED=false
CORNERMEX_LOVABLE_DISCOVERY_MODE=mock
CORNERMEX_LOVABLE_READ_ONLY=true
CORNERMEX_LOVABLE_DRY_RUN=true
CORNERMEX_LOVABLE_PROJECT_URL=
CORNERMEX_LOVABLE_PROJECT_NAME=
CORNERMEX_LOVABLE_GITHUB_REPO=
CORNERMEX_LOVABLE_DEPLOYMENT_URL=

CORNERMEX_SUPABASE_ENABLED=false
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
CORNERMEX_SUPABASE_SCHEMA=public
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_MAX_ROWS=100
CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS=10000

CORNEROPS_CORNERMEX_CONNECTOR_ENABLED=false
CORNEROPS_CORNERMEX_CONNECTOR_MODE=mock
CORNEROPS_CORNERMEX_CONNECTOR_AUDIT_READS=true
CORNEROPS_CORNERMEX_CONNECTOR_PII_MASKING=true
```

Never commit `.env` files or real secrets.

## Safe commands

```bash
npm run demo:lovable-discovery
npm run demo:cornermex-connector
npm run demo:v1.1.1
```

These run without credentials, use mock fixtures, audit reads and never mutate Lovable, GitHub or Supabase.

## Disable connector

Set:

```env
CORNERMEX_LOVABLE_ENABLED=false
CORNERMEX_SUPABASE_ENABLED=false
CORNEROPS_CORNERMEX_CONNECTOR_ENABLED=false
```

Then rerun `npm run demo:v1.1.1` and verify the connector reports mock/missing configuration.

## Verify no writes are enabled

- `CORNERMEX_SUPABASE_READ_ONLY=true`
- `CORNERMEX_SUPABASE_ALLOW_WRITES=false`
- `CORNEROPS_CORNERMEX_CONNECTOR_AUDIT_READS=true`
- No service-role key is present in client-side code or committed files.
