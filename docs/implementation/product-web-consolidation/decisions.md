# Product & Web Consolidation v1 — Decisions

Only decisions with a real alternative are recorded.

## D1 — Server-side identity verification calls Supabase Auth

The backend verifies every browser access token by calling `GET {auth url}/auth/v1/user` with the publishable key and the bearer token, with a short bounded cache (30 s for an accepted token, keyed on its SHA-256; see D9). Local JWT verification was rejected for now: it needs key management (JWKS or shared secret) and does not see revoked sessions. Any verifier failure denies the request (401 for a rejected token, 503 when the provider is unreachable or unconfigured). No new dependency.

Config names: `CORNEROPS_AUTH_SUPABASE_URL`, `CORNEROPS_AUTH_SUPABASE_PUBLISHABLE_KEY`. The service-role key is never used for identity.

## D2 — Membership lives in `cornerops_internal`, resolved per request

`workspaces` and `workspace_memberships` are private tables read through the existing internal store. Role and workspace are never taken from the token, the URL or the body. A client may send `x-cornerops-workspace: <slug>` only to choose among memberships it already holds; an unknown slug is a 403. Membership store unavailable → 503 (fail closed).

## D3 — Roles and the mutation policy

`viewer < operator < founder`.

| Policy | Minimum role | Examples |
|---|---|---|
| `read` | viewer | every GET |
| `internal_write` | operator | sales records, lead/handoff edits, internal `*-request` drafts, operator chat |
| `sensitive_config` | founder | worker, integration, settings changes; legacy approval decisions; OpenClaw skill review |
| `external_action` | founder + existing founder-action token | real GitHub issue creation, all `/api/intelligence` POST/PATCH |

Nothing is approval-by-default. Existing founder-action-token routes keep that second factor; it is not loosened in this sprint.

## D4 — Legacy `/api` paths are kept and placed behind the boundary

The generic data and context routers keep their URLs but are mounted after `appAuth`. Renaming them would be churn without security value. `/api/mock/*` aliases are removed. The GitHub webhook moves to the webhook boundary at `/api/webhooks/github`; the old `/api/github/webhook` path stays as a signature-verified alias so an existing GitHub configuration keeps working.

## D5 — Ambiguous anonymous entry points fail closed

- `POST /api/ivr`: no provider verification exists and no telephony provider is identified, so it now requires the internal service key.
- `POST /api/webhooks/whatsapp`: now requires a valid `X-Hub-Signature-256` computed with `WHATSAPP_WEBHOOK_SECRET`; without the secret it returns 503. The GET verify handshake is unchanged.
- `POST /api/chat`: classified as the internal operator chat → workspace `internal_write`.

These change behaviour for any external caller that relied on the anonymous paths. That is intended and listed in the PR.

## D6 — Token-era browser routes accept a workspace session

`/api/intelligence/*` and `/api/control-tower/frontend/v1/*` accept either the legacy operator token hash (CLI/service use) or a workspace session. The browser stops using shared tokens for reads. Web-console routes (`/api/control-tower/v0.8…v1.1`, `/api/actions`, `/api/operator/v0.8/ask`) require a workspace session in addition to their existing guard.

## D7 — Tests never bypass the boundary by environment

There is no `NODE_ENV=test` shortcut in `appAuth`. Tests install a fake identity verifier and an in-memory membership store through the same injection point production uses.

## D8 — Routes without per-workspace storage belong to the company workspace

Sales records carry `workspace_id`. The legacy operations data, configuration, Control Tower and chat do not. Those routes therefore require membership of the company workspace (`CORNEROPS_COMPANY_WORKSPACE_SLUG`, default `cornerops-ai`), not just any workspace. Without this, the first client workspace would have exposed CornerMex data and CornerOps settings to its members. Found in the self-review.

## D9 — Cheap local rejection before calling the identity provider

The verifier reads the token's own claims (unverified) only to refuse tokens that cannot be valid — malformed, expired, no subject — and to require that the provider confirms the same subject. A provider rejection is remembered for 10 s so a replayed bad token cannot be used to flood the provider. Outages are never cached. This supersedes the "never cache failures" wording an earlier draft of D1 implied. A revoked session can stay accepted for at most 30 s.

## D10 — Policy routers refuse unclassified mutations at registration

`policyRouter()` hooks `router.route()`, the single path Express uses to register every verb, so `router.post(...)` and `router.route(...).post(...)` both throw without an execution policy, and `all` is not allowed. A developer cannot add an open mutation by accident; the process fails to start and the tests fail.

## D11 — Frontend bundle size

Adding the Supabase client grows the main bundle from about 337 kB to about 607 kB (gzip about 101 kB → 180 kB). Accepted for now; lazy-loading the private app is a later optimisation, not a security matter.
