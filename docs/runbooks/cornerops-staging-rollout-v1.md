# CornerOps staging rollout v1

Purpose: prove identity, workspace authorization and Sales on a non-production environment before any production change. **This runbook is a proposal. No Railway, Supabase or DNS resource was created or changed by the sprint.** Every step below that touches infrastructure is a Founder gate.

## Why staging first

On `main` today the generic `/api` routes are anonymous. This branch closes them. Once it is deployed, anything that relied on anonymous access stops working (see "Behaviour changes"). Staging is where that is discovered safely.

If production deploys automatically from `main`, merging this PR **is** a production deployment. Confirm that setting before merging; if it is on, either complete staging first or pause auto-deploy for the merge.

## Proposed shape

| Piece | Proposal |
|---|---|
| Web service | A second Railway environment (`staging`) in the existing project, same `railway.json`, deployed from the feature branch (later from `main`). Not a new project, so configuration stays comparable. |
| Database | A separate PostgreSQL database for `cornerops_internal`. Never the production database, never a copy of production data. |
| Identity | A Supabase project for staging, or the production identity project with a staging callback URL. A separate project is cleaner; sharing is acceptable because membership is per database. |
| Domain | The Railway-generated staging hostname. No custom domain. |

## Configuration (names only)

Non-secret:

- `NODE_ENV=production`
- `CORNEROPS_FRONTEND_SERVE_ENABLED=true`
- `FRONTEND_ORIGIN=<staging origin>`
- `CORNEROPS_AUTH_SUPABASE_URL`, `CORNEROPS_AUTH_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_GOOGLE_AUTH_ENABLED=false` (build time)
- `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED=true`, `CORNEROPS_INTERNAL_PERSISTENCE_PROVIDER=postgres`
- `CONTROL_TOWER_FRONTEND_API_ENABLED`, `CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS` (if the Control Tower pages are to be exercised)
- Leave unset: `VITE_PUBLIC_SITE_URL` (staging must not claim a canonical identity)

Secret classes (values live only in the platform's secret store):

- Internal service key: `INTERNAL_API_KEY`
- Runtime database URL for the least-privileged role: `CORNEROPS_INTERNAL_DATABASE_URL`
- Operator token hashes, if used: `CONTROL_TOWER_FRONTEND_TOKEN_HASH`, `CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH`
- Provider secrets only if that provider is tested: `WHATSAPP_WEBHOOK_SECRET`, `GITHUB_WEBHOOK_SECRET`, Telegram secrets

Keep off the web service entirely: `CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL`, any service-role key.

Do not enable in staging: commercial activation flags, real outbound channels, `ALLOW_INTERNAL_NO_KEY`.

## Database boundary

Apply, in order, to the **staging** database only:

1. `20260711190000_cornerops_internal_work_queue_v19.sql` (and later existing migrations the modules under test need)
2. `20261006100000_cornerops_workspace_authorization.sql`
3. `20261006110000_cornerops_sales_mvp.sql`

The runtime connection must use a login role that is a member of `cornerops_internal_runtime` and not a table owner, superuser or `BYPASSRLS` role; otherwise row-level security does not constrain it. Verify:

```sql
select current_user, rolsuper, rolbypassrls from pg_roles where rolname = current_user;
```

Both must be false. The v1.17B commercial activation migration is not part of this rollout.

## Smoke tests

Public:

1. `/` renders; contact links work; the page makes no `/api` request.
2. `/robots.txt` disallows `/app`; `/nope` shows the 404 page.
3. `GET /api/health` → 200.

Boundary (signed out):

4. `GET /api/leads`, `GET /api/settings`, `GET /api/app/sales/accounts` → 401.
5. `PUT /api/settings`, `POST /api/approvals/x/approve`, `POST /api/chat` → 401.
6. `POST /api/ivr` without the internal key → 401. `POST /api/webhooks/whatsapp` unsigned → 401 (or 503 if the secret is unset).
7. `/app`, `/app/sales`, `/orders` → redirected to `/login?next=…`.

Identity and membership:

8. Request a sign-in link for a non-existent email → generic message, no email.
9. Sign in as a user without membership → `/access-pending`; `GET /api/leads` with that token → 403.
10. Grant `founder` with `workspace:grant`; "Check again" → `/app/overview`; refresh keeps the session.
11. Grant a second user `viewer` → no Admin group; `POST /api/app/sales/accounts` → 403.
12. Disable the viewer membership → next request 403 and the app closes.
13. Sign out → `/login`; back button does not show private data.

Sales (synthetic data only):

14. Create an account, contact, opportunity, activity; update the next step.
15. `select event_type, metadata from cornerops_internal.audit_events order by created_at desc limit 10` shows the events with ids and field names and no contact details.
16. Confirm no outbound message was produced by any provider.

Record results with the exact commit SHA.

## Rollback

- Web: redeploy the previous deployment in Railway. The new tables are additive and unused by older code, so the database does not need to change.
- Database (only if required): drop the four `sales_*` tables and `reject_sales_activity_mutation()`, then `workspace_memberships` and `workspaces`. This deletes sales records; export first if any are worth keeping.
- Identity: remove the staging callback URL from the Supabase allow-list.

## Promotion to production

All must be true:

- [ ] Smoke tests 1–16 pass on staging at the SHA to be released.
- [ ] CI green on that SHA.
- [ ] Founder approved the merge (Gate 1).
- [ ] Founder approved the production migrations (Gate 3) and they were applied before the deploy that needs them.
- [ ] Production build has the `VITE_SUPABASE_*` values; production runtime has `CORNEROPS_AUTH_SUPABASE_*`.
- [ ] Production callback URL is on the allow-list.
- [ ] Founder membership granted in production.
- [ ] Every external caller of a previously anonymous endpoint is accounted for (below).
- [ ] Founder approved enabling the private app in production (Gate 5).
- [ ] Rollback deployment identified.

## Behaviour changes to account for

| Caller | Change | Action |
|---|---|---|
| Any script or tool calling `/api/leads`, `/api/orders`, `/api/products`, `/api/dashboard`, … anonymously | now 401 | use `/api/internal/*` with the internal key, or a session |
| Telephony/IVR integration, if one exists | `/api/ivr` needs `x-internal-api-key` | configure the caller or keep it off |
| Meta WhatsApp webhook, if subscribed | POST needs a valid signature | set `WHATSAPP_WEBHOOK_SECRET` to the Meta app secret |
| GitHub webhook | unchanged check; canonical URL is now `/api/webhooks/github`, old URL still accepted | optional: update the URL |
| Monitoring that polled `/api/control-tower/status` anonymously | needs the internal key | add the header |
| Lovable or other front ends using the operator token | unchanged | none |
| `/api/mock/*` | removed | none expected |
