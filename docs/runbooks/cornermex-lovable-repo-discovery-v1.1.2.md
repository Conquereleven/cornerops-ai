# CornerMex Lovable Repo Discovery Runbook v1.1.2

## How it works

Repo discovery uses founder-provided `CORNERMEX_LOVABLE_GITHUB_REPO` to move the connector toward `repo_discovered`. It records the areas CornerOps must inspect read-only: routes, admin areas, Supabase setup, env refs, table refs and business flows.

## It reads

- App/admin routes
- Supabase references
- Env var names
- Product/lead/quote/order/customer/payment flows
- Manual payment, Bank Transfer and COD references
- Write-risk patterns

## It never does

- No repo file edits
- No issue creation
- No PR merge
- No workflow trigger
- No labels/comments

## Disable

Unset `CORNERMEX_LOVABLE_GITHUB_REPO` or set `CORNERMEX_LOVABLE_ENABLED=false`.

## Write-risk paths

Patterns such as `.insert(` and `.update(` are reported as risk documentation only. CornerOps does not execute those paths in v1.1.2.
