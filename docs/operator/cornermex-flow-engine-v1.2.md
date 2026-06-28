# CornerMex Flow Engine v1.2

The CornerMex Flow Engine turns read-only CornerMex connector data into operational summaries for founder commands.

## Supported Flows
- `b2b_lead_flow`
- `quote_follow_up_flow`
- `order_attention_flow`
- `manual_payment_review_flow`
- `product_quality_flow`
- `customer_follow_up_flow`
- `fulfillment_review_flow`

## Source Modes
- `mock`: fixture data only.
- `repo_discovered`: Lovable-connected repo is configured, but no live Supabase reads.
- `real_read_only`: Supabase URL + anon/read-only key are configured and safe checks pass.
- `mixed`: multiple read-only source modes are present.
- `local_internal`: local CornerOps-only draft/task context.
- `dry_run`: simulated action path.

## Guarantees
- The engine uses `LovableCornerMexConnector`.
- It never mutates products, leads, quotes, orders, customers, payments or inventory.
- It does not mark payments paid.
- It only suggests internal tasks and drafts.
- Every output labels source mode.

Run:

```bash
npm run demo:cornermex-flows
```
