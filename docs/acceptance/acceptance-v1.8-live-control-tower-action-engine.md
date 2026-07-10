# CornerOps AI v1.8 Live Control Tower + Action Engine Acceptance

## Scope

v1.8 makes the Control Tower feel operational without weakening safety. CornerOps remains the backend brain; Lovable is the cockpit. The backend now exposes live read-only status, Action Engine recommendations, product activation recommendations, operating stage coverage, and environment diagnostics.

## Live

- `GET /api/intelligence/control-tower-status`
- `GET /api/intelligence/action-engine`
- `POST /api/intelligence/action-engine/drafts`
- `GET /api/intelligence/product-activation`
- `GET /api/intelligence/environment-doctor`
- Existing `/api/control-tower/frontend/v1/*` contract now consumes the live v1.8 services when available.

## Internal Draft Enabled

- Product quality review
- Catalog cohort review
- Founder Review next-action drafts
- Internal launch readiness tasks
- Payment/quote/lead review drafts when readable data exists

Drafts are returned as internal objects only. Persistence is marked `not_configured` unless a safe internal store is available. No external sends occur.

## Approval Required

- Quote follow-up drafts
- Email send paths, still disabled in this sprint
- GitHub writes through PR/review flow
- Lovable mutations through manual approval
- Any future internal write path that is not explicitly safe

## Blocked By Safety

- Supabase production writes
- Product activation
- Product/order/payment/customer mutation
- WhatsApp sends
- External customer emails
- Customer channel actions
- Destructive SQL
- OpenClaw execution

These are not UI failures. They should render as mature capability states:

- `Live read-only`
- `Internal draft enabled`
- `Approval required`
- `Blocked by safety`
- `Needs configuration`
- `No data yet`

## No Data Yet

- `order_attention_flow`: `No orders requiring founder attention yet.`
- `fulfillment_review_flow`: `No fulfillment or shipment records available yet.`
- `customer_follow_up_flow`: `Pre-launch customer follow-up is disabled until customer history and consent exist.`

These should not be shown as broken states.

## Catalog Cohort

Expected current production state:

- 199 total readable products
- 190 imported Intermex draft products
- 9 existing active products
- 190 imported products with stock 50
- 0 duplicate SKU groups
- Image/supplier fields may require read model mapping if the public read-only view does not expose them

## Expected API Shape

`GET /api/intelligence/control-tower-status` returns:

- `mode`
- `source`
- `fallbackActive`
- `safety`
- `connectors`
- `catalog`
- `founderReview`
- `capabilityMatrix`
- `actionEngine`
- `productActivation`
- `operatingStage`
- `stageWorkflows`
- `nextStageUnlocks`
- `launchReadiness`
- `workflowCoverage`
- `environmentDoctor`

## Verification Commands

```bash
npm test -- tests/liveControlTowerActionEngineV18.test.js
npm test -- tests/controlTowerFrontendContractV13.test.js
npm run demo:control-tower-frontend-contract
npm run lint
CORNERMEX_EXPECTED_PRODUCT_COUNT=190 npm run cornermex:catalog-read-report
CORNERMEX_OPERATING_STAGE=pre_launch CORNERMEX_LAUNCH_DATE=2026-08-17 CORNERMEX_EXPECTED_PRODUCT_COUNT=190 npm run founder:review
git diff --check
```

If available:

```bash
npm run typecheck
npm run build
```

## Safety Guarantees

- No secrets are exposed.
- No tokens are committed.
- No external sends are enabled.
- No customer channels are enabled.
- No product activation is enabled.
- No production Supabase writes are enabled.
- No destructive SQL is introduced.
- Fallback/mock states are not used when live read-only data exists.

## Lovable Update

Paste-ready update prompt:

- `docs/lovable/prompts/control-tower-v1.8-live-action-engine.md`

The Lovable UI must show `199` as total readable products and `190` as imported Intermex draft products. These values are intentionally separate.
