# CornerMex Lovable Real Config v1.1.2

v1.1.2 moves the CornerMex Lovable connector toward real configuration without enabling writes.

## Target progression

1. `mock`: local fake fixtures, no real config.
2. `repo_discovered`: Lovable-connected GitHub repo configured and inspected read-only.
3. `real_read_only`: Supabase anon/read-only config present, write flags blocked.

## Required config

```env
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
CORNERMEX_SUPABASE_SCHEMA_DISCOVERY_ENABLED=false
```

## Current CornerMex config intake

The founder provided the Lovable project URL for CornerMex:

```env
CORNERMEX_LOVABLE_PROJECT_URL=https://lovable.dev/projects/d9495376-339d-44dd-9c8a-db0f7b451f96
CORNERMEX_LOVABLE_PROJECT_NAME=CornerMex
CORNERMEX_LOVABLE_GITHUB_REPO=Conquereleven/corner-mex-uae
CORNERMEX_LOVABLE_DEPLOYMENT_URL=https://corner-mex-uae.lovable.app
```

These values are non-secret and are safe to include in `.env.founder.local.example`.
Supabase remains unconfigured until the founder provides a Supabase URL and anon/read-only key.

## Commands

```bash
npm run cornermex:lovable-config-check
npm run demo:cornermex-lovable-real-config
npm run demo:v1.1.2
```

## Service-role warning

Do not use Supabase service-role keys for v1.1.2. The validator flags service-role-shaped values when detectable. Use anon/read-only credentials only.

## How to read modes

- `missing_config`: founder config is incomplete.
- `mock`: fake fixtures only.
- `repo_discovered`: repo readiness exists, but data may still be mock.
- `real_read_only`: read-only Supabase candidate is configured and write flags are blocked.
