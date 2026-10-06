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
| GET | `/api/actions` | workspace session, policy read + local console guard |
| GET | `/api/actions/:id` | workspace session, policy read + local console guard |
| POST | `/api/actions/github/issues/draft` | workspace session, policy internal_write + local console guard |
| POST | `/api/actions/github/issues/request-approval` | workspace session, policy internal_write + local console guard |
| POST | `/api/actions/internal-notes/request-approval` | workspace session, policy internal_write + local console guard |
| POST | `/api/actions/internal-tasks/request-approval` | workspace session, policy internal_write + local console guard |
| GET | `/api/app/sales/accounts` | workspace session, policy read |
| POST | `/api/app/sales/accounts` | workspace session, policy internal_write |
| GET | `/api/app/sales/accounts/:accountId` | workspace session, policy read |
| PATCH | `/api/app/sales/accounts/:accountId` | workspace session, policy internal_write |
| POST | `/api/app/sales/accounts/:accountId/activities` | workspace session, policy internal_write |
| POST | `/api/app/sales/accounts/:accountId/contacts` | workspace session, policy internal_write |
| POST | `/api/app/sales/accounts/:accountId/opportunities` | workspace session, policy internal_write |
| PATCH | `/api/app/sales/contacts/:contactId` | workspace session, policy internal_write |
| POST | `/api/app/sales/import/preview` | workspace session, policy internal_write |
| PATCH | `/api/app/sales/opportunities/:opportunityId` | workspace session, policy internal_write |
| GET | `/api/app/sales/summary` | workspace session, policy read |
| GET | `/api/app/session` | session identity; memberships are reported, not required |
| GET | `/api/approvals` | workspace session, policy read |
| GET | `/api/audit-logs` | workspace session, policy read |
| POST | `/api/chat` | workspace session, policy internal_write |
| GET | `/api/context/health` | workspace session, policy read |
| GET | `/api/context/search` | workspace session, policy read |
| GET | `/api/context/sources` | workspace session, policy read |
| GET | `/api/context/sources/:id` | workspace session, policy read |
| POST | `/api/context/sources/:id/sync-request` | workspace session, policy internal_write |
| GET | `/api/control-tower/frontend/v1` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/actions` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/approvals` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/audit` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/capabilities` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/connection-test` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/cornermex` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/drafts` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/environment-doctor` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/flows` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/founder-daily` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/security` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/status` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/telegram` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/frontend/v1/work-queue` | workspace session (viewer+) or operator token |
| GET | `/api/control-tower/v0.8/agents` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/approvals` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/audit-summary` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/context-sources` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/data-sources` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/first-real-source` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/rate-limits` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/rejections` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/replay` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/security` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/status` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.8/telegram` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.9/approvals` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.9/audit-summary` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v0.9/status` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.0/approvals` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.0/audit-summary` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.0/status` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.1/approvals` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.1/audit-summary` | workspace session, policy read + local console guard |
| GET | `/api/control-tower/v1.1/status` | workspace session, policy read + local console guard |
| GET | `/api/conversations` | workspace session, policy read |
| GET | `/api/conversations/:id` | workspace session, policy read |
| GET | `/api/conversations/:id/messages` | workspace session, policy read |
| GET | `/api/crawlers` | workspace session, policy read |
| GET | `/api/crawlers/:id/health` | workspace session, policy read |
| GET | `/api/dashboard` | workspace session, policy read |
| GET | `/api/data-health` | workspace session, policy read |
| GET | `/api/events` | workspace session, policy read |
| GET | `/api/github/issues` | workspace session, policy read |
| GET | `/api/github/issues/:number` | workspace session, policy read |
| POST | `/api/github/issues/draft` | workspace session, policy internal_write |
| GET | `/api/github/pull-requests` | workspace session, policy read |
| GET | `/api/github/pull-requests/:number` | workspace session, policy read |
| GET | `/api/github/repository` | workspace session, policy read |
| GET | `/api/github/workflow-runs` | workspace session, policy read |
| GET | `/api/github/workflow-runs/:id` | workspace session, policy read |
| GET | `/api/handoffs` | workspace session, policy read |
| PATCH | `/api/handoffs/:id` | workspace session, policy internal_write |
| GET | `/api/integrations` | workspace session, policy read |
| GET | `/api/intelligence/action-engine` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/anomalies` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/approvals` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/approvals/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/cases` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/clients` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/accounts` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/daily-closes` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/exceptions` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/founder-daily` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/fulfillments` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/opportunities` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/orders` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/payments` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/quotes` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/skus` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/commercial/status` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/connectors` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/control-tower-status` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/environment-doctor` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/founder-review` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/overview` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/playbooks` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/product-activation` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/signals` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/authorized-sellers` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/authorized-sellers/:sellerKey` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/authorized-sellers/:sellerKey/onboarding-preview` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/catalog` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/catalog/:catalogItemId/evidence` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/catalog/capture-summary` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id/latest-match` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id/match-runs` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/demand-requests/:id/supplier-coverage` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-conflicts` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-expiring` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-packages` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-packages/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/evidence-packages/:id/preview` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/inventory/initialization-status` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/match-runs` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/match-runs/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/match-runs/:id/supplier-coverage` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/media/coverage` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/products/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/products/:id/inventory` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/products/:id/media` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-catalog-gaps` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-coverage` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-onboarding-packages` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-onboarding-packages/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-onboarding-packages/:id/preview` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/seller-readiness` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/catalog` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/catalog-health` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/inventory` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/sellers/:id/media-status` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/status` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/suppliers` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/suppliers/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/suppliers/:supplierId/evidence-status` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/supplygraph/wave1-activation` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/:id` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/audit` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/drafts` | workspace session (viewer+) or operator token |
| GET | `/api/intelligence/work-queue/status` | workspace session (viewer+) or operator token |
| GET | `/api/leads` | workspace session, policy read |
| GET | `/api/leads/:id` | workspace session, policy read |
| PATCH | `/api/leads/:id` | workspace session, policy internal_write |
| POST | `/api/leads/:id/status-change-request` | workspace session, policy internal_write |
| GET | `/api/leads/follow-up` | workspace session, policy read |
| GET | `/api/local-archives/records` | workspace session, policy read |
| GET | `/api/local-archives/records/:id` | workspace session, policy read |
| GET | `/api/native-tools` | workspace session, policy read |
| GET | `/api/openclaw-ecosystem/services` | workspace session, policy read |
| GET | `/api/openclaw-ecosystem/skills` | workspace session, policy read |
| POST | `/api/operator/v0.8/ask` | workspace session, policy internal_write + local console guard |
| GET | `/api/orders` | workspace session, policy read |
| POST | `/api/orders/:id/manual-payment-mark-paid-request` | workspace session, policy internal_write |
| POST | `/api/orders/:id/status-change-request` | workspace session, policy internal_write |
| GET | `/api/orders/:orderNumber` | workspace session, policy read |
| GET | `/api/orders/manual-payments` | workspace session, policy read |
| GET | `/api/orders/requiring-action` | workspace session, policy read |
| GET | `/api/products` | workspace session, policy read |
| GET | `/api/products/:sku` | workspace session, policy read |
| GET | `/api/products/search` | workspace session, policy read |
| GET | `/api/quotes` | workspace session, policy read |
| GET | `/api/quotes/:id` | workspace session, policy read |
| GET | `/api/quotes/follow-up` | workspace session, policy read |
| GET | `/api/sdk/clawbench/reports` | workspace session, policy read |
| POST | `/api/sdk/clawbench/run-request` | workspace session, policy internal_write |
| GET | `/api/sdk/plugin-inspector/reports` | workspace session, policy read |
| POST | `/api/sdk/plugin-inspector/review-request` | workspace session, policy internal_write |
| GET | `/api/settings` | workspace session, policy read |
| GET | `/api/worker-runs` | workspace session, policy read |
| GET | `/api/workers` | workspace session, policy read |

### FOUNDER / CONTROLLED (53)

| Method | Path | Authentication |
|---|---|---|
| POST | `/api/actions/approvals/:id/execute` | workspace session, policy external_action + local console guard |
| POST | `/api/actions/approvals/:id/execute-dry-run` | workspace session, policy sensitive_config + local console guard |
| POST | `/api/approvals` | workspace session, policy sensitive_config |
| POST | `/api/approvals/:id/approve` | workspace session, policy sensitive_config |
| POST | `/api/approvals/:id/reject` | workspace session, policy sensitive_config |
| POST | `/api/context/retention-change-request` | workspace session, policy sensitive_config |
| POST | `/api/context/sources/:id/enable-request` | workspace session, policy sensitive_config |
| POST | `/api/control-tower/v0.8/approvals/:id/approve-dry-run` | workspace session, policy sensitive_config + local console guard |
| POST | `/api/control-tower/v0.8/approvals/:id/reject-dry-run` | workspace session, policy sensitive_config + local console guard |
| POST | `/api/github/issues` | workspace session, policy external_action |
| PATCH | `/api/integrations/:id` | workspace session, policy sensitive_config |
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
| POST | `/api/native-tools/:id/enable-request` | workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/crabox/run-suite` | workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/lobster/workflows/dry-run` | workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/skills/:id/approve` | workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/skills/:id/disable` | workspace session, policy sensitive_config |
| POST | `/api/openclaw-ecosystem/skills/review` | workspace session, policy sensitive_config |
| PUT | `/api/settings` | workspace session, policy sensitive_config |
| PATCH | `/api/workers/:id` | workspace session, policy sensitive_config |

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
