# CornerMex Supabase Read-Only Security v1.1.3

## Posture

CornerOps remains read-only and dry-run by default. Schema discovery reads repo evidence and does not connect to Supabase unless founder credentials are explicitly configured.

## Key Handling

- Never commit `.env` files.
- Never print Supabase keys.
- Do not use service-role keys.
- Use anon/publishable read-only access and verify RLS.

## Mutation Blocking

Required flags:

```env
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_BLOCK_MUTATIONS=true
```

Mutation methods `insert`, `update`, `delete`, `upsert` and mutating `rpc` calls remain blocked/documented only.

## PII

PII candidates include email, phone, recipient names and shipping addresses. PII masking remains enabled by default.

## Rollback

Unset Supabase URL/key and set:

```env
CORNERMEX_SUPABASE_ENABLED=false
CORNEROPS_CORNERMEX_CONNECTOR_MODE=repo_discovered
```
