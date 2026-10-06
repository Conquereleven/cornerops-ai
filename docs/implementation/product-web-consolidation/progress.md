# Product & Web Consolidation v1 — Progress

All four planned sessions were run back to back in one local session on 2026-10-06.

| Session | Scope | State |
|---|---|---|
| A | Baseline, threat model, decisions | done — `c0a30bc` |
| B | Identity, workspace authorization, API security | done — `c523065` (backend), `45ed638` (frontend guard) |
| C | Navigation, Company Ops, Sales MVP | done — `8af7d84` (API + schema), `45ed638` (UI) |
| D | Domain + DevOps readiness, regression, adversarial review | done — `e0efe57` and the review-fix commit after it |

## Checkpoints

- **0 Baseline** — `baseline.md`.
- **1 Identity** — PR #85's PKCE client, callback, login form and `safeNextPath` were ported; its fixed `workspaceAccess: 'pending'` was replaced by `GET /api/app/session`. `safeNextPath` gained origin re-resolution after a test showed `/..//host` collapsed into a protocol-relative path.
- **2 Authorization + API security** — `cornerops_internal.workspaces` / `workspace_memberships`; `appAuth` boundary; 276 routes classified, none unclassified; every workspace/founder route swept anonymously in a production-mode app.
- **3 Navigation + Company Ops** — registry has `surface`; Core 8, Admin 5, Commerce OS incubator 20, hidden 14; workspace label is CornerOps AI; legacy paths redirect inside the guard.
- **4 Sales** — four tables with forced RLS; `/api/app/sales/*`; list + account detail UI; CSV preview validator; mapping doc.
- **5 Domain + DevOps** — `siteConfig`, canonical/sitemap on `VITE_PUBLIC_SITE_URL`, robots, favicon; CI with PostgreSQL service, secret scan and inventory check; four runbooks, one decision note, release checklist.

## Self-review findings fixed

1. Legacy, configuration and Control Tower routes accepted any workspace's members → company-workspace scope (D8).
2. Garbage or expired tokens each cost a provider call → local precheck and short negative cache (D9).
3. `router.all` / `router.route().post` could register a mutation without a policy → blocked (D10).
4. CSV preview echoed the first row of a headerless file → non-header-looking names are replaced by `column N`.
5. No anti-framing, nosniff, referrer or HSTS headers → added; API and private SPA routes send `X-Robots-Tag: noindex`.
6. `/..//host` passed `safeNextPath` → rejected.
7. `x-cornerops-workspace` was missing from CORS allowed headers (would break a cross-origin frontend) → added.
8. Access-pending claimed "not granted" when the backend was merely unreachable → now says access could not be verified.

## Not verified

- Sign-in against a real Supabase project, and the private UI in a real browser. No auth configuration exists locally and none was added. The public landing, login (unconfigured state), 404 and the anonymous deep-link redirect were checked in a browser; everything behind the guard is covered by component and API tests only.
- Row-level security under the production connection role. Tests run as `cornerops_internal_runtime`; the role production actually connects as was not inspected.
- CI on GitHub with the new PostgreSQL service (first run happens on the PR).

## Residual risks

- No application-level rate limiting on the workspace boundary.
- `internalAuth` passes everything when `NODE_ENV=test`.
- Sessions live in browser storage (Supabase default); an XSS would expose them. No CSP beyond `frame-ancestors` was added.
- `owner_user_id` on sales records is not checked against workspace membership.
- Git history was not scanned for secrets.

## Next action

Founder review of the PR, then the staging rollout in `docs/runbooks/cornerops-staging-rollout-v1.md`.
