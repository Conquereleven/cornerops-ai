# CO-1.17A Commercial Operations Core Acceptance

Branch: `feature/cornerops-v1.17a-commercial-operations`

Base: `8ae0d4966edfbc70c9da1b561b87eb7114e23a2c`

## Implemented

- Versioned JSON/CSV account and SKU input with per-record errors, duplicate detection, preview,
  checksum and explicit confirmation.
- Opportunity, quote, order, payment, fulfillment, exception and Daily Close contracts.
- Deterministic totals and evidence gates; unknown commercial facts remain unknown.
- Stable order, payment, fulfillment, exception, Work Queue and approval keys.
- Commercial Founder Daily separates quotes, pending revenue, confirmed revenue and cash.
- Existing Command Center extended with commercial modules; no second dashboard.
- Private PostgreSQL migration proposed with forward/rollback instructions; not applied.
- Deterministic demo labeled `COMMERCIAL_DEMO_DATA_NOT_PRODUCTION` and disabled in production.

## Human boundary

Humans may create and approve internal records, export a quote, confirm a manual send, record
payment evidence, confirm 3PL handoff and resolve exceptions with evidence. CornerOps cannot send
email/WhatsApp, capture/refund money, buy inventory, create shipments, contact another party,
activate products, change external prices or write CornerMex.

## Required business inputs

Joel must provide actual priority B2B accounts, launch SKUs, costs, approved prices, MOQs,
inventory evidence, payment terms, shipping rules, owners, SLAs and regulatory restrictions.
Nothing is generated to reach the 10-account or 18-SKU targets.

## Activation

Production activation is deferred. It requires separate migration approval, grant introspection,
rolled-back forbidden-operation probes, business input review and explicit enablement of
`CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED`. No platform action belongs to this PR.

Final status: `implementation_complete_pending_exact_head_review_and_deferred_migration`
