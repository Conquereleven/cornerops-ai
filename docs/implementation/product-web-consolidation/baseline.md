# Product & Web Consolidation v1 — Baseline (Checkpoint 0)

Recorded 2026-10-06.

## Execution context

- Model actually running: `claude-opus-5-5` (the brief's preferred model). The Founder's kickoff message mentioned "Claude Fable"; the session was not running Fable. No silent fallback occurred.
- Runtime: Claude Code desktop session on the Founder's machine, not an isolated cloud sandbox. Consequences: no cloud-credit telemetry is observable, and the session has connectors (Railway, Supabase, GitHub merge) that are broader than this sprint needs. None of the extra capability is used.
- Effort controls are not exposed to the agent; the session default was used.
- Credentials are sufficient for feature-branch + PR work. No production credential was read or required.

## Git

- Base: `main` @ `f74b5dcfe920ac5849b352745ebdc5f83ae37bc2` (merge of PR #90).
- Branch: `feature/cornerops-product-web-consolidation-v1` (did not exist remotely before this sprint).

## Relevant PRs

| PR | State | Treatment |
|---|---|---|
| #85 real authentication (`feature/cornerops-web-1d-auth`, 1 commit `d56ddd6`) | open, mergeable | Reference. Frontend PKCE client, callback, `safeNextPath`, login UI are ported. Its hard-coded `workspaceAccess: 'pending'` is replaced by server-verified membership. |
| #83 commercial activation v1.17B | open | Isolated. Nothing imported. |
| #89 Shopify read-only connector | open | Isolated. Not required. |
| #80 CornerGlass prototype | open, conflicting | Not touched. |
| #81 v1.17A acceptance docs | open | Not touched. |

## Repository instructions

- No root `AGENTS.md` / `CLAUDE.md`. `frontend/AGENTS.md` records durable Founder decisions: preserve the accepted public landing / CornerGlass hierarchy; public contact channels are Founder-approved values.
- Package manager: npm with lockfiles at root and `frontend/`. Node >= 22. No migration of package manager.
- Backend: Express 4 (CommonJS), Jest + supertest. Frontend: Vite + React 19 + react-router 7, Vitest.
- CI: `.github/workflows/ci.yml`, single job `test` (lint, typecheck, backend tests, frontend tests, build, safe demos).

## Baseline commands

| Command | Result |
|---|---|
| `npm run lint` | pass (625 files) |
| `npm test` | 132 suites passed, 3 skipped; 782 tests passed, 15 skipped |
| `npm run typecheck` | pass |
| `npm run test:frontend` | 8 files, 20 tests passed |
| `npm run build` | pass |

The first local run of the three frontend commands failed only because the local `frontend/node_modules` was stale (`animejs` missing). `npm --prefix frontend ci` fixed it; the repository itself is green.

The 3 skipped backend suites are PostgreSQL-gated (`CORNEROPS_TEST_POSTGRES_URL`). A disposable local PostgreSQL 17 cluster is used for migration tests in this sprint.

## Architecture map

- `src/app.js` mounts all routers. `src/routes/*` → `src/controllers/*` → `src/core/*`, `src/data/repositories/*`.
- Private persistence: PostgreSQL schema `cornerops_internal`, accessed only through `PostgresInternalOperationsStore` + `InternalWriteBoundary` (table allowlist in `workQueueTypes.INTERNAL_TABLES`). Audit is the append-only `cornerops_internal.audit_events`.
- Migrations: `supabase/migrations/*.sql` (10 files; latest `20260828230707_commerce_os_order_persistence.sql`). Convention: `begin/commit`, `revoke all` from public roles, forced RLS, check constraints.
- Frontend: `frontend/src/App.tsx` mounts `PublicLanding` at `/`, a visual-only `LoginGateway` at `/login`, and 45 registry modules at top-level paths (`/overview`, `/orders`, …) with **no guard at all**. API calls carry either nothing or a shared operator token kept in `sessionStorage`.

## Existing auth mechanisms (before this sprint)

| Mechanism | Used by |
|---|---|
| none | `/api/chat`, `/api/ivr`, the whole generic `/api` data router and context router, `/api/control-tower/{status,beta,…}` unless `CORNEROPS_CONTROL_TOWER_REQUIRE_AUTH` |
| `internalAuth` (`x-internal-api-key`; bypassed when `NODE_ENV=test`) | `/api/internal`, `/api/openclaw`, `/api/operator` |
| `webConsoleGuard` (enabled flag, loopback-only, shared token) | `/api/control-tower/v0.8…v1.1`, `/api/actions`, `/api/operator/v0.8/ask` |
| Control Tower frontend token hash | `/api/intelligence`, `/api/control-tower/frontend/v1` |
| Founder-action token hash (+ rate limit, origin) | every POST/PATCH under `/api/intelligence` |
| Provider secret | Telegram webhook (secret header), GitHub webhook (HMAC), WhatsApp GET verify token |

## Threat model — confirmed findings on `main`

| ID | Finding | Severity |
|---|---|---|
| T1 | Generic `/api` router is anonymous: reads of leads, orders, conversations and messages, quotes, audit logs, approvals, settings. | High |
| T2 | Same router exposes anonymous mutations: `PATCH /api/leads/:id`, `PATCH /api/workers/:id`, `PATCH /api/integrations/:id`, `PUT /api/settings`, `POST /api/approvals`, `POST /api/approvals/:id/approve|reject`, `POST /api/github/issues`, OpenClaw skill approve/disable. | High |
| T3 | `POST /api/chat` and `POST /api/ivr` are anonymous and drive the AI worker (cost, lead/conversation creation). | Medium |
| T4 | `POST /api/webhooks/whatsapp` processes any body without signature verification; `WHATSAPP_WEBHOOK_SECRET` exists in config but is unused. | Medium |
| T5 | `/api/context/*`, `/api/local-archives/*`, `/api/crawlers`, `/api/native-tools`, `/api/sdk/*` are anonymous, including `*-request` POSTs. | Medium |
| T6 | `/api/control-tower/{status,beta,data-contracts,schema-discovery,security,approvals,audit-summary}` are anonymous by default. | Medium |
| T7 | No frontend route guard; every private module is reachable by URL. | High (with T1) |
| T8 | Browser authorization relies on a shared static token in `sessionStorage`; there is no per-user identity or role. | Medium |
| T9 | `requestLogger` logs `originalUrl` including query strings. | Low |
| T10 | `internalAuth` is bypassed whenever `NODE_ENV=test`. Left unchanged (test-suite contract); recorded as residual risk. | Low |

## Contradictions with the brief

- Model/runtime wording (Fable vs Opus 5.5, cloud vs local) — recorded above, not blocking.
- The brief names the private schema generically; the repository's convention is `cornerops_internal`. The convention is followed.
- None material to architecture or security.

## Files expected to change

Backend: `src/app.js`, `src/routes/*`, new `src/core/identity/*`, `src/core/sales/*`, `src/middleware/appAuth.js`, `src/controllers/{app,sales}Controller.js`, `src/config/env.js`, `workQueueTypes.js`, `whatsappController.js`, `requestLogger.js`, new migrations, `scripts/workspace-grant.js`, tests.
Frontend: `App.tsx`, `auth/*`, `lib/{api,supabase,siteConfig}.ts`, `config/moduleRegistry.ts`, layout, `routes/{LoginGateway,AuthCallback,AccessPending,Sales*,Overview}.tsx`, `index.html`, `public/*`, tests.
Docs/CI: `docs/security`, `docs/product`, `docs/runbooks`, `docs/decisions`, `.github/workflows/ci.yml`.
