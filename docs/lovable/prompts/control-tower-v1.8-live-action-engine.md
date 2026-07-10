# Lovable Prompt: Control Tower v1.8 Live Action Engine

Update the existing `CornerOps Control Tower` Lovable app to use the live backend contract instead of old mock/fallback assumptions.

Use the CornerOps backend as the source of truth. Lovable remains only the visual cockpit. Do not store secrets, do not use Supabase service role keys, do not call WhatsApp/email send APIs, do not mutate products, orders, payments, customers, leads, quotes, Supabase, GitHub or Lovable marketplace data.

## Backend Endpoints

Use these read-only endpoints where available:

- `GET /api/intelligence/control-tower-status`
- `GET /api/intelligence/action-engine`
- `POST /api/intelligence/action-engine/drafts`
- `GET /api/intelligence/product-activation`
- `GET /api/intelligence/environment-doctor`
- existing `/api/control-tower/frontend/v1/*` section endpoints

Every response must keep showing:

- `sourceMode`
- `auditId`
- `readOnly`
- `dryRun`
- `writesBlocked`
- `externalSendsBlocked`
- `approvalRequired`
- `warnings`

## Catalog Cohort

Render the live catalog cohort as:

- Total readable products: `catalog.totalReadableProducts`
- Imported Intermex draft products: `catalog.importedIntermexDraftProducts`
- Expected imported product count: `catalog.expectedImportedProductCount`
- Existing active products: `catalog.existingActiveProducts`
- Products with stock 50: `catalog.productsWithStock50`
- Duplicate SKU groups: `catalog.duplicateSkuCount`

Important current state:

- `totalReadableProducts` is expected to be `199`
- `importedIntermexDraftProducts` must display as `190`
- `expectedImportedProductCount` must display as `190`
- `existingActiveProducts` is expected to be `9`

Do not collapse `199` total products and `190` imported draft products into one number. They mean different things.

If image fields are missing from the read-only model, show a warning/next action: `Expose image_url in read-only product view for final image QA`. Do not invent image counts.

## Founder Review

Show Founder Review as active but pre-launch:

- Operating stage: `pre_launch`
- Product quality flow: live/internal draft enabled
- Launch readiness may still be `needs_work`
- Capability blocks are intentional safety rails, not failures

## Action Engine

Create a visible `Action Engine` section or upgrade the existing actions/drafts areas:

- Recommended actions from `actionEngine.recommendedActions`
- Flow states from `actionEngine.flows`
- Approval queue from `actionEngine.approvalQueue`
- Internal drafts from `POST /api/intelligence/action-engine/drafts`

Drafts must show:

- `sendStatus=not_sendable_in_current_version`
- `persistence=not_configured`
- WhatsApp sends disabled
- Email sends disabled
- Production writes blocked

## Capability Matrix

Use calm mature labels:

- `live_read_only` -> Live read-only
- `internal_draft_enabled` -> Internal draft enabled
- `approval_required` -> Approval required
- `blocked_by_safety` -> Blocked by safety
- `not_configured` -> Needs configuration
- `no_data_yet` -> No data yet

Do not render `blocked_by_safety` or `no_data_yet` as critical errors.

## Product Activation

Render product activation as recommendation-only:

- `totalDraftProducts`
- `readyToActivate`
- `needsReview`
- `recommendedBatches`
- `nextActions`

All activation buttons must be disabled. Label clearly: `Activation blocked until explicit founder approval and safe write workflow exist`.

## Safety

Keep these visibly blocked:

- Supabase production writes
- Product activation
- Product/order/payment/customer mutation
- WhatsApp sends
- External customer emails
- Customer channels
- Destructive SQL
- OpenClaw execution

Preserve the premium dark internal OS style. Keep cards compact, source-labeled, and fast to scan.
