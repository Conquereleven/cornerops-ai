# CT-WEB-SEC-01 — API containment review

Prepared 2026-10-20. This branch is a review candidate, **not deployed**. No production variables, infrastructure, domains, DNS, database, customer infrastructure, or external messaging were changed. No production mutations were used to test exposure.

## A. Baseline

Repository: Conquereleven/cornerops-ai. Security branch: `security/ct-web-api-containment-v1`, based solely on main `f74b5dcfe920ac5849b352745ebdc5f83ae37bc2`.

Railway project `10deb808-6af7-4529-a6f8-b63026c88db9` (CornerTech AI), environment `6d33520e-bd58-4ad6-bf03-4bb4439964da` (production), service `3c57d108-d956-49b2-b65f-d798cbedd656` (cornerops-ai). Source main; current SUCCESS deployment `e60316eb-bae5-4560-a2d8-d8055ca71f7f` at the baseline SHA; no staged changes. Main merges may auto-deploy: approval to review this PR is not approval to merge.

PR #91: `22c8510559b6a583a7a13b63301e79cdfe1b7d10`, open, unmerged. PR #92: `f6332f4fc5cfa36447c02f123567fb46046a30c0`, open draft, stacked on #91. PR #94: `0b1c18c216eb05ca598305236b56002c5cab8cd0`, open draft on main. None are dependencies of this hotfix; none were modified.

## B. Complete route matrix

`ct-web-sec-01-routes.json` is generated from the actual Express mount and route stacks by `NODE_ENV=test node scripts/api-route-inventory.js`. The security test requires the checked-in inventory to match runtime discovery. It contains 251 distinct route patterns / 701 method entries, explicit handlers, baseline guard descriptions, middleware declarations, proposed guard, category and anonymous response expectations. GET includes implicit HEAD; OPTIONS is enumerated. Static/fallback rules are separate. Unsupported callback verbs return 405. Parser-level malformed, oversized and compressed JSON can return 400/413/415 before authentication, without invoking a business handler.

| Family | Category | New behavior |
|---|---|---|
| GET/HEAD `/health`, `/api/health` | PUBLIC | 200 with status/service only; no credential/database metadata |
| `/`, static assets, non-API SPA fallback | PUBLIC | Existing serving/kill switch; no business API dependency |
| data, `/mock/*` aliases, context, tools, archives, chat, IVR, internal, OpenClaw, base Control Tower, legacy operator, unknown future `/api/*` | INTERNAL | Missing INTERNAL_API_KEY: 503. Missing/wrong caller key: 401. Correct key preserves existing handler/feature/safety checks |
| intelligence and Control Tower frontend/v1 | INTERNAL | Existing operator hash token required (401/403); disabled/unsafe/unconfigured: 503. Existing founder token/rate/safety checks retained for mutations |
| versioned Control Tower, operator/v0.8, actions | PRIVATE_DISABLED | Existing feature/local-only/origin/safety checks retained; console token mandatory even when optional-auth flag is false. Disabled 404; missing configuration 503; invalid token 401 |
| WhatsApp GET | PROVIDER_CALLBACK | Configured verification token + subscribe + string challenge required; missing config 503, wrong handshake 403; HEAD/unsupported verbs 405 |
| WhatsApp/GitHub POST | PROVIDER_CALLBACK | Exact raw bytes + SHA-256 HMAC, timing-safe comparison; missing secret 503; missing/invalid signature 401 |
| Telegram POST | PROVIDER_CALLBACK | Existing disabled 404 + denial audit; enabled requires configured constant-time webhook secret and existing actor/feature policy; missing secret 503, wrong secret 401 |

Private OPTIONS requests pass the boundary before generic CORS. Bridge OPTIONS is the sole API preflight exception: existing origin validation, 204 or 403, no business handler or payload. It is not authorization for GET/POST. Case and trailing-slash variants remain protected. Encoded API-looking paths cannot fall through to static HTML. Host, Referer, Origin, query tokens and forwarded IP claims never substitute for a credential.

## C. Legitimate callers and compatibility

Railway returned 98 HTTP metadata entries for a seven-day requested window (2026-10-13 through audit time), with observed timestamps 2026-10-13 15:34:30Z through 2026-10-20 13:23:51Z. Aggregates only are retained; no IPs, user agents, bodies, query strings or customer records. This is evidence of observed traffic, not proof of complete retention or absence of other callers.

| Caller | Evidence | Effect |
|---|---|---|
| Railway/prod-watch health | 41 GET /api/health 200; workflow checks HTTP status only; fresh status-only probe 200 | Preserved 200, sanitized body |
| Hourly prod-watch work queue | 40 GET /api/intelligence/work-queue/status 200; workflow sends Bearer CONTROL_TOWER_OPERATOR_TOKEN; fresh anonymous status-only probe 401 | Existing operator credential and path preserved; synthetic authenticated test passes |
| Marketing landing/assets | 5 root GETs plus assets/favicon; public frontend has no operational API requirement | Preserved; no service key embedded in frontend |
| Existing Control Tower bridge UI and diagnostic script | frontend/src/lib/api.ts and scripts/control-tower-frontend-api-check.js use existing token; hash/required variable names configured | Same mechanism; auth-disabled configuration now fails closed |
| Legacy workspace browser calls (data/chat/etc.) | frontend/src/lib/api.ts sends no internal service key on these methods; no observed operational calls in returned logs | Deliberately unavailable under current production configuration. Do not put the service key in a browser; private application rollout is separate |
| Service-to-service internal/OpenClaw/IVR/chat | Existing INTERNAL_API_KEY contract; no key name configured and no observed calls in returned logs | Disabled 503 until separately authorized server-side configuration/caller migration |
| WhatsApp | Neither verify-token nor webhook-secret name configured; no callback observed | Disabled; no unsigned agents. Future setup requires Meta app secret in WHATSAPP_WEBHOOK_SECRET and handshake token, separately authorized |
| GitHub callbacks | GITHUB_WEBHOOK_SECRET name absent; no callbacks observed; existing verifier already rejects absent secret | Remains closed; configured deployments now validate original bytes correctly |
| Telegram | TELEGRAM_OPERATOR_WEBHOOK_SECRET name absent; no callbacks observed | Remains unavailable; no activation or messages |
| Local demos/CLI | Repo references in demo-control-tower-backend-bridge, visual-local-acceptance, demo-v1.4, frontend-contract and real-operator-channel scripts | Local/direct-module fixtures; no evidence of additional production HTTP dependency. Safe beta demos pass |

Variable API returned names only (values redacted). Presence is not proof of valid values. No verified mission-critical caller requires the removed anonymous access. Founder must resolve any undocumented essential caller discovered before activation; seven-day metadata cannot establish that none exist.

## D. Findings and limits

Confirmed in baseline source: data/context/chat/IVR handlers lacked identity guards; internalAuth allowed NODE_ENV=test and ALLOW_INTERNAL_NO_KEY bypasses; some console/operator auth was optional; WhatsApp accepted unsigned input and advertised an unconfigured placeholder; GitHub signatures were verified after JSON reserialization. CORS and hidden UI links did not prevent direct API calls. Public health disclosed internal configuration metadata.

Potential impact includes unauthorized business reads, write proposals/state changes and agent invocation, subject to each handler's downstream policy/configuration. No actual exploitation, data loss or customer-data disclosure is claimed. Production API mutations were not attempted.

## E. Change surface

One central boundary in `src/middleware/apiContainment.js`; strict existing internal/console/operator guards; bounded raw JSON capture; raw GitHub verifier input; WhatsApp configuration/handshake fail-closed; API/static fallback isolation; public health minimization. Request/error logs omit query strings (including handshake tokens); malformed JSON errors do not echo the body. Raw bodies are never logged. Provider compressed JSON is rejected to avoid ambiguity about signed bytes.

Functional test fixtures now explicitly send synthetic service credentials. They no longer depend on a test-mode bypass. Security tests use raw supertest without that helper. No migration, auth UI, dependency, storage-contract, frontend design or deployment-configuration changes. Legacy CORNEROPS identifiers preserved.

## F. Validation

Backend regression and focused containment tests pass locally, including all enumerated private methods, aliases, future paths, wrong keys, no-key bypass, agent-call denial, raw-byte tampering, wrong signature algorithm, valid mocked WhatsApp/GitHub callbacks, health and existing operator access. Existing console/bridge/founder tests remain active. Frontend tests, syntax lint, typecheck, build and safe beta demos pass. Route classification is checked in Jest. The final delivery report records exact counts, secret scan, final SHA and GitHub CI URL; readiness requires green CI for that SHA.

## G. Activation risks / remaining security work

Production remains on the vulnerable baseline until a separately authorized release. Do not launch the public domain while this containment is only a draft. Current configuration intentionally causes 503 on legacy private APIs. The shared service/operator credentials are coarse-grained identities, not per-user authorization; keep them out of public frontend bundles. Do not enable missing webhook credentials or private functionality as part of this patch. Signed callback replay/idempotency hardening, broader authenticated authorization and rate/abuse controls remain separate work; this PR does not certify the entire application secure. Existing downstream feature/safety flags still constrain authenticated actions.

## H. Rollback

Read-only Railway evidence confirms current baseline deployment `e60316eb-bae5-4560-a2d8-d8055ca71f7f`, snapshot `9992e7af-d1c1-458e-b18f-41cfc9f5f6b9`, canRollback=true and canRedeploy=true. These are available options, not executed rollback tests. Recheck availability immediately before an approved release.

After a future approved deployment, verify public health/static assets, existing authenticated monitoring and negative API tests using synthetic/non-mutating checks. If failure requires rollback, obtain Founder authorization to restore the previous deployment or revert this code change through a reviewed PR. No database rollback or migrations are required. **Restoring the baseline reopens the known exposure**: do not combine it with public DNS launch; prioritize forward correction or separately authorized containment. A code revert to main may auto-deploy, so it is also a production gate.

## I. PR #94 ordering

Security review/explicit production authorization → security lands on main → rebase/regenerate only PR #94's public commits onto secured main → regenerate `tests/fixtures/public-release-baseline.json` against secured main → rerun security and public boundary checks, frontend tests/build and visual review → separate GO PUBLIC LIVE authorization. The existing public baseline hash intentionally pins old backend bytes and must change after security lands. Never merge/cherry-pick #91 or #92. A clean textual merge alone is insufficient; the final report includes a disposable combined-tree compatibility check. This sprint leaves PR #94 unchanged.

## J–K. Gate

Draft review only. Founder next action: review the exact security PR and intentional legacy API shutdown; authorize a distinct security release only after CI and caller assessment are accepted. Public-site release/DNS/private-app activation remain separate gates. Readiness is reported only in the delivery report once exact-head CI is confirmed.

## Final review corrections (reviewed base 1f4678382907e3d1d4b80e535b3e8181bb80b25c)

The request logger now registers before parsing and containment, so denied requests are recorded as well as authorized ones. It captures the full pathname before router rewrites, strips control characters and bounds its length; only method, pathname, response status and duration are supplied to the existing logger. Credentials, query strings and bodies are never included. The duplicate WhatsApp secret configuration property was removed without changing its value or environment-variable contract.

Regression tests inspect emitted logs for 401/403/503 and authenticated monitoring. The production compatibility matrix above remains unchanged: with the last audited configuration, unconfigured internal APIs intentionally return 503, public health returns 200, configured operator monitoring returns 200 with its existing token, and missing/invalid operator credentials remain denied. No production credentials or configuration were read or modified for these corrections. Complete local validation: 800 backend tests passed, 15 pre-existing skipped; 20 frontend tests passed, with lint, typecheck and build. Final exact-head CI and secret-scan evidence are recorded in the delivery report.
