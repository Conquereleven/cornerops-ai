# CornerMex Data Contracts v1.1.3

v1.1.3 upgrades CornerMex contracts with Supabase migration/schema evidence from the Lovable-connected repo.

## Confidence Rules

- `low`: mock/template only.
- `medium`: repo or migration evidence exists.
- `high`: live Supabase read-only schema is confirmed.
- `blocked`: unsafe write config or service-role-like credentials.

## Contract Mapping

| Contract | Evidence Tables | Confidence Without Credentials | PII Candidates |
| --- | --- | --- | --- |
| Product | `products`, `product_variants`, `categories` | medium | none obvious |
| Lead | `b2b_leads`, `lead_notes`, `lead_status_history` | medium | `full_name`, `email`, `phone` |
| Quote | `b2b_leads`, quote status evidence | medium | `email`, `phone`, contact fields |
| Order | `orders`, `order_items`, `order_events`, `order_notes` | medium | `shipping_address` |
| Customer | `profiles`, `addresses` | medium | `full_name`, `email`, `phone`, `recipient_name` |
| Payment | `orders.payment_method`, `orders.payment_status`, `paid_at` | medium | order/customer linked fields |

## Limitations

Migration evidence is not live data. It proves schema shape from repo files, not current production rows or RLS behavior. `real_read_only` remains blocked until Supabase URL and anon/read-only key are provided and verified.
