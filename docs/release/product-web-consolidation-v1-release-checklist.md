# Product & Web Consolidation v1 — release checklist

**NO PRODUCTION DEPLOYMENT OR MIGRATION IS AUTHORIZED BY THE SPRINT.** Each unchecked box below is done by, or with explicit approval from, the Founder.

## 1. Identify the release

- [ ] Exact commit SHA: `________________________________________`
- [ ] PR number and title recorded.
- [ ] CI `test` job green on that SHA (not on an earlier one).
- [ ] `npm run security:route-inventory:check` clean; no route is unclassified.

## 2. Migrations

| File | SHA-256 |
|---|---|
| `supabase/migrations/20261006100000_cornerops_workspace_authorization.sql` | `sha256sum` the file at the release SHA |
| `supabase/migrations/20261006110000_cornerops_sales_mvp.sql` | `sha256sum` the file at the release SHA |

- [ ] Hashes match the PR description.
- [ ] Applied to staging and verified.
- [ ] Founder approved production application (Gate 3).
- [ ] Applied to production in order, before the deploy.
- [ ] Runtime role verified: not owner, not superuser, not `BYPASSRLS`.
- [ ] The v1.17B commercial activation migration was **not** applied.

## 3. Auth configuration

- [ ] Build has `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Runtime has `CORNEROPS_AUTH_SUPABASE_URL`, `CORNEROPS_AUTH_SUPABASE_PUBLISHABLE_KEY`.
- [ ] No secret or service-role key in any `VITE_` variable; built bundle checked.
- [ ] Public sign-ups disabled in Supabase Auth.
- [ ] Callback allow-list contains exactly the environment's `/auth/callback` URL.

## 4. Workspace membership bootstrap

- [ ] Founder user exists in Supabase Auth; user id recorded privately.
- [ ] `npm run workspace:grant … --role founder` dry-run reviewed, then `--confirm`.
- [ ] Audit event `workspace_membership_granted` present.
- [ ] Administrative database URL removed from the shell afterwards.

## 5. Route security smoke tests (signed out)

- [ ] `GET /api/health` → 200
- [ ] `GET /api/leads` → 401
- [ ] `GET /api/settings` → 401
- [ ] `PUT /api/settings` → 401
- [ ] `POST /api/approvals/x/approve` → 401
- [ ] `POST /api/chat` → 401
- [ ] `GET /api/app/session` → 401
- [ ] `GET /api/app/sales/accounts` → 401
- [ ] `POST /api/ivr` → 401
- [ ] `POST /api/webhooks/whatsapp` (unsigned) → 401 or 503
- [ ] `GET /api/mock/leads` → 401

## 6. Public landing smoke tests

- [ ] `/` renders on desktop and mobile width; no horizontal scroll.
- [ ] Booking, email and WhatsApp links are the intended ones.
- [ ] No Privacy/Terms link unless real documents are configured.
- [ ] `/robots.txt` served; `/favicon.svg` served.
- [ ] Unknown URL shows the 404 page.
- [ ] Reduced-motion preference respected.

## 7. Private deep-link tests

- [ ] Signed out: `/app`, `/app/sales`, `/app/admin/settings`, `/orders` → `/login?next=…`
- [ ] Signed in, no membership → `/access-pending`
- [ ] Founder → `/app/overview`; workspace shows `CornerOps AI`
- [ ] Viewer → no Admin group; `/app/admin/settings` refused
- [ ] Refresh on a deep link keeps the page
- [ ] Sign out returns to `/login`
- [ ] `/login?next=https://example.com` does not leave the site after sign-in

## 8. Sales

- [ ] Create account, contact, opportunity, activity with synthetic data.
- [ ] Audit events present without contact details.
- [ ] No provider shows an outbound message.

## 9. Rollback point

- [ ] Previous production deployment id recorded: `____________________`
- [ ] Rollback is a redeploy of that deployment; new tables can stay.

## 10. Domain and SSL (only when a domain is connected — Gate 4)

- [ ] Founder chose the domain.
- [ ] DNS records created; certificate issued.
- [ ] `VITE_PUBLIC_SITE_URL` set at build; `<link rel="canonical">` and `/sitemap.xml` show the domain.
- [ ] New callback URL on the Supabase allow-list; Site URL updated.
- [ ] `FRONTEND_ORIGIN` and any allowed-origin lists updated.
- [ ] Old hostname redirects or is retired deliberately.
- [ ] Contact email switched through `VITE_PUBLIC_CONTACT_EMAIL` once a branded mailbox exists.

## Still gated after release

Commercial Operations, any external send, automated sales execution, branch protection, repository visibility.
