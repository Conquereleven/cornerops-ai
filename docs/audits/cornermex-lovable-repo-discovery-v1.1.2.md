# CornerMex Lovable Repo Discovery v1.1.2

## Status

- Repo config provided by founder: `Conquereleven/corner-mex-uae`
- Lovable project URL provided: `https://lovable.dev/projects/d9495376-339d-44dd-9c8a-db0f7b451f96`
- Deployment URL candidate: `https://corner-mex-uae.lovable.app`
- Current mode with these non-secret values: `repo_discovered` candidate
- Supabase live data mode: still blocked until anon/read-only config is provided

## What repo discovery reads

- App framework hints
- Routes/pages
- Admin/dashboard areas
- Supabase client setup
- Env var names
- Data table references
- Quote/order/product/customer flows
- Manual payment, Bank Transfer and COD references
- Write-risk patterns: `.insert(`, `.update(`, `.delete(`, `.upsert(`, `.rpc(`

## What repo discovery never does

- It never modifies repo files.
- It never creates GitHub issues.
- It never comments, labels, merges PRs or triggers workflows.
- It treats write-risk paths as documentation only.

## Current read-only findings

- GitHub repo: `https://github.com/Conquereleven/corner-mex-uae`
- Visibility: public
- Default branch: `main`
- Lovable template: `tanstack_start_ts_2026-05-12`
- Framework: TanStack Start, Vite, React 19, TypeScript, Tailwind, Cloudflare/Vite, Lovable cloud auth.
- Supabase package: `@supabase/supabase-js`
- Supabase client path: `src/integrations/supabase/client.ts`
- Supabase env refs observed: `VITE_SUPABASE_URL`, `SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`
- App routes observed: `/`, `/shop`, `/product.$slug`, `/cart`, `/checkout`, `/order-confirmed`, `/b2b`, `/b2b_.lead`, `/sellers`, `/login`, `/signup`.
- Admin routes observed: `/admin`, `/admin/orders`, `/admin/leads`, `/admin/products`, `/admin/customers`, `/admin/settings`, `/admin/shipping`, `/admin.returns`, `/admin.payouts`.
- Business flow files observed: `src/lib/b2b-leads.functions.ts`, `src/lib/orders.functions.ts`, `src/lib/payments.functions.ts`, `src/lib/catalog.functions.ts`, `src/lib/admin.functions.ts`.
- Supabase migrations observed under `supabase/migrations`.
- Mapping confidence: medium for repo discovery, still not high until Supabase schema is read in `real_read_only` mode.

## Write-risk documentation only

Repo discovery can document write-risk paths from file names and patterns, but CornerOps v1.1.2 does not execute or mutate them. Known areas requiring careful read-only handling before real data activation:

- `src/lib/orders.functions.ts`
- `src/lib/payments.functions.ts`
- `src/lib/admin.functions.ts`
- `src/lib/b2b-leads.functions.ts`
- `supabase/migrations/*`

## Next steps

Run the config check with the non-secret project values:

```bash
CORNERMEX_LOVABLE_PROJECT_URL=https://lovable.dev/projects/d9495376-339d-44dd-9c8a-db0f7b451f96 \
CORNERMEX_LOVABLE_PROJECT_NAME=CornerMex \
CORNERMEX_LOVABLE_GITHUB_REPO=Conquereleven/corner-mex-uae \
CORNERMEX_LOVABLE_DEPLOYMENT_URL=https://corner-mex-uae.lovable.app \
npm run cornermex:lovable-config-check
npm run demo:v1.1.2
```
