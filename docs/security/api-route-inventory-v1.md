# API route inventory v1

Every API route mounted by `src/app.js`, classified into exactly one class. The table between the markers is generated from the running route table by `npm run security:route-inventory`; `tests/apiRouteInventory.test.js` fails when a route is unclassified or this file is stale.

## Boundary order

```text
GET /health, /api/health                      public
/api/internal, /api/openclaw, /api/ivr         internal service key
/api/webhooks/*, /api/github/webhook,          provider signature / secret
/api/operator-channel/*
------------------------------------------------ authenticated application boundary
/api/app/*                                     workspace session
/api/chat, /api/actions, /api/control-tower/v* workspace session (+ local console guard)
/api/intelligence, /api/control-tower/frontend workspace session or operator token; mutations need the founder-action token
/api/*  (data + context routers, mounted last) workspace session; unknown paths answer 401 before 404
```

## Rules

- Default is deny: the data and context routers are built with `policyRouter()`, which refuses to register a mutation that does not declare an execution policy, and the router-level boundary runs before any path matching.
- Role and workspace come only from `cornerops_internal.workspace_memberships`.
- Policies: `read` → viewer, `internal_write` → operator, `sensitive_config` → founder, `external_action` → founder.
- `FOUNDER / CONTROLLED` means founder role and/or the founder-action token. It does not mean an approval queue.

## Changes made by Product & Web Consolidation v1

| Route(s) | Before | After |
|---|---|---|
| Generic `/api` data router (leads, orders, products, quotes, conversations, approvals, audit logs, workers, handoffs, integrations, settings, GitHub reads, OpenClaw ecosystem) | anonymous | workspace session; mutations by policy |
| `/api/context/*`, `/api/local-archives/*`, `/api/crawlers`, `/api/native-tools`, `/api/sdk/*` | anonymous | workspace session; mutations by policy |
| `POST /api/chat` | anonymous | workspace session, `internal_write` |
| `POST /api/ivr` | anonymous | internal service key |
| `POST /api/webhooks/whatsapp` | unsigned | `X-Hub-Signature-256` required; 503 without `WHATSAPP_WEBHOOK_SECRET` |
| `POST /api/github/webhook` | inside the anonymous data router | webhook boundary; canonical path `POST /api/webhooks/github`, old path kept as alias |
| `/api/control-tower/{status,beta,data-contracts,schema-discovery,security,approvals,audit-summary}` | anonymous unless a flag was set | internal service key always |
| `/api/control-tower/v0.8…v1.1`, `/api/actions`, `POST /api/operator/v0.8/ask` | local console guard only | workspace session + local console guard |
| `/api/intelligence/*`, `/api/control-tower/frontend/v1/*` | operator token only | workspace session or operator token; auth cannot be disabled in production |
| `/api/mock/orders`, `/api/mock/products`, `/api/mock/leads` | anonymous aliases | removed |
| `GET /api/app/session`, `/api/app/sales/*` | — | new |

## Residual risk

- `internalAuth` passes every request when `NODE_ENV=test`. Production must never run with that value.
- An operator token that happens to have the shape `a.b.c` is treated as a session token and rejected.

<!-- inventory:start -->

Total routes: 276

### PUBLIC (2)

| Method | Path | Authentication |
|---|---|---|
| GET | `/api/health` | none |
| GET | `/health` | none |

### AUTHENTICATED WORKSPACE (180)

| Method | Path | Authentication |
|---|---|---|
| GET | `/api/actions` | company workspace session, policy read + local console guard |
| GET | `/api/actions/:id` | company workspace session, policy read + local console guard |
| POST | `/api/actions/github/issues/draft` | company workspace session, policy internal_write + local console guard |
| POST | `/api/actions/github/issues/request-approval` | company workspace session, policy internal_write + local console guard |
| POST | `/api/actions/internal-notes/request-approval` | company workspace session, policy internal_write + local console guard |
| POST | `/api/actions/internal-tasks/request-approval` | company workspace session, policy internal_write + local console guard |
| GET | `/api/app/sales/accounts` | workspace session (own workspace), policy read |
| POST | `/api/app/sales/accounts` | workspace session (own workspace), policy internal_write |
| GET | `/api/app/sales/accounts/:accountId` | workspace session (own workspace), policy read |
| PATCH | `/api/app/sales/accounts/:accountId` | workspace session (own workspace), policy internal_write |
| POST | `/api/app/sales/accounts/:accountId/activities` | workspace session (own workspace), policy internal_write |
| POST | `/api/app/sales/accounts/:accountId/contacts` | workspace session (own workspace), policy internal_write |
| POST | `/api/app/sales/accounts/:accountId/opportunities` | workspace session (own workspace), policy internal_write |
| PATCH | `/api/app/sales/contacts/:contactId` | workspace session (own workspace), policy internal_write |
| POST | `/api/app/sales/import/preview` | workspace session (own workspace), policy internal_write |
| PATCH | `/api/app/sales/opportunities/:opportunityId` | workspace session (own workspace), policy internal_write |
| GET | `/api/app/sales/summary` | workspace session (own workspace), policy read |
| GET | `/api/app/session` | session identity; memberships are reported, not required |
| GET | `/api/approvals` | company workspace session, policy read |
| GET | `/api/audit-logs` | company workspace session, policy read |
| POST | `/api/chat` | company workspace session, policy internal_write |
| GET | `/api/context/health` | company workspace session, policy read |
| GET | `/api/context/search` | company workspace session, policy read |
| GET | `/api/context/sources` | company workspace session, policy read |
| GET | `/api/context/sources/:id` | company workspace session, policy read |
| POST | `/api/context/sources/:id/sync-request` | company workspace session, policy internal_write |
| GET | `/api/control-tower/frontend/v1` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/actions` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/approvals` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/audit` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/capabilities` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/connection-test` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/cornermex` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/drafts` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/environment-doctor` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/flows` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/founder-daily` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/security` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/status` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/telegram` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/work-queue` | company workspace session (viewer+) or operator token |
| GET | `/api/control-tower/v0.8/agents` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/approvals` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/audit-summary` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/context-sources` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/data-sources` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/first-real-source` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/rate-limits` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/rejections` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/replay` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/security` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/status` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/telegram` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.9/approvals` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.9/audit-summary` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.9/status` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.0/approvals` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.0/audit-summary` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.0/status` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.1/approvals` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.1/audit-summary` | company workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.1/status` | company workspace session, policy read + local console guard |
| GET | `/api/conversations` | company workspace session, policy read |
| GET | `/api/conversations/:id` | company workspace session, policy read |
| GET | `/api/conversations/:id/messages` | company workspace session, policy read |
| GET | `/api/crawlers` | company workspace session, policy read |
| GET | `/api/crawlers/:id/health` | company workspace session, policy read |
| GET | `/api/dashboard` | company workspace session, policy read |
| GET | `/api/data-health` | company workspace session, policy read |
| GET | `/api/events` | company workspace session, policy read |
| GET | `/api/github/issues` | company workspace session, policy read |
| GET | `/api/github/issues/:number` | company workspace session, policy read |
| POST | `/api/github/issues/draft` | company workspace session, policy internal_write |
| GET | `/api/github/pull-requests` | company workspace session, policy read |
| GET | `/api/github/pull-requests/:number` | company workspace session, policy read |
| GET | `/api/github/repository` | company workspace session, policy read |
| GET | `/api/github/workflow-runs` | company workspace session, policy read |
| GET | `/api/github/workflow-runs/:id` | company workspace session, policy read |
| GET | `/api/handoffs` | company workspace session, policy read |
| PATCH | `/api/handoffs/:id` | company workspace session, policy internal_write |
| GET | `/api/integrations` | company workspace session, policy read |
| GET | `/api/intelligence/action-engine` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/anomalies` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/approvals` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/approvals/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/cases` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/clients` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/accounts` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/daily-closes` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/exceptions` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/founder-daily` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/fulfillments` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/opportunities` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/orders` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/payments` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/quotes` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/skus` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/status` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/connectors` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/control-tower-status` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/environment-doctor` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/founder-review` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/overview` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/playbooks` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/product-activation` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/signals` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/authorized-sellers` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/authorized-sellers/:sellerKey` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/authorized-sellers/:sellerKey/onboarding-preview` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/catalog` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/catalog/:catalogItemId/evidence` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/catalog/capture-summary` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id/latest-match` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id/match-runs` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id/supplier-coverage` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-conflicts` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-expiring` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-packages` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-packages/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-packages/:id/preview` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/inventory/initialization-status` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/match-runs` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/match-runs/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/match-runs/:id/supplier-coverage` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/media/coverage` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/products/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/products/:id/inventory` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/products/:id/media` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-catalog-gaps` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-coverage` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-onboarding-packages` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-onboarding-packages/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-onboarding-packages/:id/preview` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-readiness` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/catalog` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/catalog-health` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/inventory` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/media-status` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/status` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/suppliers` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/suppliers/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/suppliers/:supplierId/evidence-status` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/wave1-activation` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/:id` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/audit` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/drafts` | company workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/status` | company workspace session (viewer+) or operator token |
| GET | `/api/leads` | company workspace session, policy read |
| GET | `/api/leads/:id` | company workspace session, policy read |
| PATCH | `/api/leads/:id` | company workspace session, policy internal_write |
| POST | `/api/leads/:id/status-change-request` | company workspace session, policy internal_write |
| GET | `/api/leads/follow-up` | company workspace session, policy read |
| GET | `/api/local-archives/records` | company workspace session, policy read |
| GET | `/api/local-archives/records/:id` | company workspace session, policy read |
| GET | `/api/native-tools` | company workspace session, policy read |
| GET | `/api/openclaw-ecosystem/services` | company workspace session, policy read |
| GET | `/api/openclaw-ecosystem/skills` | company workspace session, policy read |
| POST | `/api/operator/v0.8/ask` | company workspace session, policy internal_write + local console guard |
| GET | `/api/orders` | company workspace session, policy read |
| POST | `/api/orders/:id/manual-payment-mark-paid-request` | company workspace session, policy internal_write |
| POST | `/api/orders/:id/status-change-request` | company workspace session, policy internal_write |
| GET | `/api/orders/:orderNumber` | company workspace session, policy read |
| GET | `/api/orders/manual-payments` | company workspace session, policy read |
| GET | `/api/orders/requiring-action` | company workspace session, policy read |
| GET | `/api/products` | company workspace session, policy read |
| GET | `/api/products/:sku` | company workspace session, policy read |
| GET | `/api/products/search` | company workspace session, policy read |
| GET | `/api/quotes` | company workspace session, policy read |
| GET | `/api/quotes/:id` | company workspace session, policy read |
| GET | `/api/quotes/follow-up` | company workspace session, policy read |
| GET | `/api/sdk/clawbench/reports` | company workspace session, policy read |
| POST | `/api/sdk/clawbench/run-request` | company workspace session, policy internal_write |
| GET | `/api/sdk/plugin-inspector/reports` | company workspace session, policy read |
| POST | `/api/sdk/plugin-inspector/review-request` | company workspace session, policy internal_write |
| GET | `/api/settings` | company workspace session, policy read |
| GET | `/api/worker-runs` | company workspace session, policy read |
| GET | `/api/workers` | company workspace session, policy read |

### FOUNDER / CONTROLLED (53)

| Method | Path | Authentication |
|---|---|---|
| POST | `/api/actions/approvals/:id/execute` | company workspace session, policy external_action + local console guard |
| POST | `/api/actions/approvals/:id/execute-dry-run` | company workspace session, policy sensitive_config + local console guard |
| POST | `/api/approvals` | company workspace session, policy sensitive_config |
| POST | `/api/approvals/:id/approve` | company workspace session, policy sensitive_config |
| POST | `/api/approvals/:id/reject` | company workspace session, policy sensitive_config |
| POST | `/api/context/retention-change-request` | company workspace session, policy sensitive_config |
| POST | `/api/context/sources/:id/enable-request` | company workspace session, policy sensitive_config |
| POST | `/api/control-tower/v0.8/approvals/:id/approve-dry-run` | company workspace session, policy sensitive_config + local console guard |
| POST | `/api/control-tower/v0.8/approvals/:id/reject-dry-run` | company workspace session, policy sensitive_config + local console guard |
| POST | `/api/github/issues` | company workspace session, policy external_action |
| PATCH | `/api/integrations/:id` | company workspace session, policy sensitive_config |
| POST | `/api/intelligence/action-engine/drafts` | founder-action token; founder role when session |
| POST | `/api/intelligence/approvals/:id/approve` | founder-action token; founder role when session |
| POST | `/api/intelligence/approvals/:id/cancel` | founder-action token; founder role when session |
| POST | `/api/intelligence/approvals/:id/reject` | founder-action token; founder role when session |
| PATCH | `/api/intelligence/cases/:id/status` | founder-action token; founder role when session |
| POST | `/api/intelligence/cases/from-anomaly` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/daily-close` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/exceptions/:id/transition` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/fulfillments/:id/transition` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/input-packs/confirm` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/input-packs/preview` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/opportunities` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/orders/:id/fulfillment` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/orders/:id/payments` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/orders/:id/transition` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/quotes` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/quotes/:id/accept` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/quotes/:id/export` | founder-action token; founder role when session |
| POST | `/api/intelligence/commercial/quotes/:id/transition` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/authorized-sellers/:sellerKey/onboarding-packages` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/demand-requests` | founder-action token; founder role when session |
| PATCH | `/api/intelligence/supplygraph/demand-requests/:id` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/demand-requests/:id/match` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/evidence-packages` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/evidence-packages/:id/apply` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/evidence-packages/:id/cancel` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/intermex/sync` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/seller-onboarding-packages` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/seller-onboarding-packages/:id/apply` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/seller-onboarding-packages/:id/cancel` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/seller-onboarding-packages/from-snapshot` | founder-action token; founder role when session |
| POST | `/api/intelligence/supplygraph/wave1-activation/work-queue/sync` | founder-action token; founder role when session |
| PATCH | `/api/intelligence/work-queue/:id` | founder-action token; founder role when session |
| POST | `/api/intelligence/work-queue/sync` | founder-action token; founder role when session |
| POST | `/api/native-tools/:id/enable-request` | company workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/crabox/run-suite` | company workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/lobster/workflows/dry-run` | company workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/skills/:id/approve` | company workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/skills/:id/disable` | company workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/skills/review` | company workspace session, policy sensitive_config |
| PUT | `/api/settings` | company workspace session, policy sensitive_config |
| PATCH | `/api/workers/:id` | company workspace session, policy sensitive_config |

### INTERNAL SERVICE (36)

| Method | Path | Authentication |
|---|---|---|
| GET | `/api/control-tower/approvals` | x-internal-api-key |
| GET | `/api/control-tower/audit-summary` | x-internal-api-key |
| GET | `/api/control-tower/beta` | x-internal-api-key |
| GET | `/api/control-tower/data-contracts` | x-internal-api-key |
| GET | `/api/control-tower/schema-discovery` | x-internal-api-key |
| GET | `/api/control-tower/security` | x-internal-api-key |
| GET | `/api/control-tower/status` | x-internal-api-key |
| GET | `/api/internal/conversations` | x-internal-api-key |
| GET | `/api/internal/conversations/:id` | x-internal-api-key |
| GET | `/api/internal/customers` | x-internal-api-key |
| POST | `/api/internal/customers` | x-internal-api-key |
| GET | `/api/internal/leads` | x-internal-api-key |
| POST | `/api/internal/leads` | x-internal-api-key |
| POST | `/api/internal/leads/:leadId/notes` | x-internal-api-key |
| PATCH | `/api/internal/leads/:leadId/status` | x-internal-api-key |
| GET | `/api/internal/orders` | x-internal-api-key |
| GET | `/api/internal/orders/:orderNumber` | x-internal-api-key |
| GET | `/api/internal/products` | x-internal-api-key |
| GET | `/api/internal/products/search` | x-internal-api-key |
| POST | `/api/internal/products/sync-mocks` | x-internal-api-key |
| GET | `/api/internal/worker-events` | x-internal-api-key |
| POST | `/api/ivr` | x-internal-api-key |
| GET | `/api/openclaw/approvals` | x-internal-api-key |
| POST | `/api/openclaw/approvals` | x-internal-api-key |
| GET | `/api/openclaw/approvals/:id` | x-internal-api-key |
| POST | `/api/openclaw/approvals/:id/approve` | x-internal-api-key |
| POST | `/api/openclaw/approvals/:id/reject` | x-internal-api-key |
| GET | `/api/openclaw/audit-logs` | x-internal-api-key |
| GET | `/api/openclaw/health` | x-internal-api-key |
| POST | `/api/openclaw/messages` | x-internal-api-key |
| GET | `/api/operator/approvals` | x-internal-api-key |
| POST | `/api/operator/ask` | x-internal-api-key |
| GET | `/api/operator/audit-summary` | x-internal-api-key |
| GET | `/api/operator/help` | x-internal-api-key |
| GET | `/api/operator/sessions/:id` | x-internal-api-key |
| GET | `/api/operator/status` | x-internal-api-key |

### WEBHOOK / PROVIDER CALLBACK (5)

| Method | Path | Authentication |
|---|---|---|
| POST | `/api/github/webhook` | provider signature / secret |
| POST | `/api/operator-channel/telegram/webhook` | provider signature / secret |
| POST | `/api/webhooks/github` | provider signature / secret |
| GET | `/api/webhooks/whatsapp` | provider signature / secret |
| POST | `/api/webhooks/whatsapp` | provider signature / secret |

<!-- inventory:end -->
