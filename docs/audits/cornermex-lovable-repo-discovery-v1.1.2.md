# CornerMex Lovable Repo Discovery v1.1.2

## Status

- Repo config default: missing
- Required variable: `CORNERMEX_LOVABLE_GITHUB_REPO`
- Current mode without repo: `mock`
- Candidate mode with repo: `repo_discovered`

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

## Current template findings

- Framework: unknown until repo contents are configured/read.
- App routes: `/products`, `/quote`, `/cart`, `/checkout`
- Admin routes: `/admin`, `/admin/orders`, `/admin/quotes`, `/admin/products`
- Supabase refs to confirm: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `createClient`
- Mapping confidence: low without repo, medium with repo discovery.

## Next steps

Set `CORNERMEX_LOVABLE_GITHUB_REPO` to the Lovable-connected CornerMex repo and run:

```bash
npm run cornermex:lovable-config-check
npm run demo:v1.1.2
```
