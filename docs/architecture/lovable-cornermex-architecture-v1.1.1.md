# Lovable CornerMex Architecture v1.1.1

CornerMex currently lives in Lovable. Lovable is the app/product builder layer where the marketplace and admin experience are built. CornerOps AI remains the operating brain: orchestration, memory, permissions, policies, approvals and audit.

## Connection model

```txt
CornerOps AI
  -> CornerMex Lovable project
  -> connected GitHub repository, if available
  -> Supabase/backend used by Lovable, if available
  -> CornerMex data contracts
  -> agents, Control Tower, daily briefing, approvals, audit logs
```

## Discovery order

1. Founder-provided Lovable project URL/name identifies the app.
2. Founder-provided connected GitHub repo is the preferred read-only discovery path.
3. Supabase/backend read-only credentials are the preferred data path.
4. Mock fixtures keep local demos and tests useful when configuration is missing.

## Guardrails

- Do not scrape Lovable UI.
- Do not use browser automation against Lovable.
- Do not mutate the Lovable project.
- Do not use service-role credentials.
- Do not run migrations.
- Do not call insert, update, delete, upsert or mutation RPC functions.
- Do not invent production schemas.
- Keep every external send and production write disabled by default.

## Source modes

- `missing_config`: Lovable project discovery lacks founder configuration.
- `mock`: connector uses fake fixtures and template contracts.
- `repo_discovered`: a Lovable-connected repo is configured and can be inspected read-only.
- `real_read_only`: Supabase/backend read-only config is present with write blocking verified.

## Founder inputs required

- Lovable project URL/name.
- Connected GitHub repo.
- Supabase URL and anon/read-only key.
- Schema/table names if known.
- Lovable `.env.example`.
- Deployment URL if available.
