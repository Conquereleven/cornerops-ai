# CornerMex Supabase Migration Schema Map v1.1.3

## Source

- Repo: `Conquereleven/corner-mex-uae`
- Mode: read-only repo analysis
- Migration path: `supabase/migrations`
- Generated types: `src/integrations/supabase/types.ts`
- Migrations executed: no

## Tables Inferred

- `products`
- `product_variants`
- `b2b_leads`
- `lead_notes`
- `orders`
- `order_items`
- `order_events`
- `addresses`
- `profiles`

## Entity Mapping

| Entity | Tables | Confidence | Notes |
| --- | --- | --- | --- |
| Product | `products`, `product_variants` | medium | Product catalog and variants are visible in generated types. |
| Lead | `b2b_leads`, `lead_notes` | medium | PII candidates: full name, email, phone. |
| Quote | `b2b_leads` | medium | Quote workflow maps to B2B lead fields until a dedicated quote table is confirmed. |
| Order | `orders`, `order_items`, `order_events` | medium | PII candidate: shipping address. |
| Customer | `profiles`, `addresses` | medium | PII candidates: recipient name, email, phone. |
| Payment | `orders.payment_method`, `orders.payment_status`, `paid_at` | medium | Dedicated payment table not confirmed. |

## Relationships Inferred

- `order_items.order_id -> orders.id`
- `order_items.product_id -> products.id`
- `lead_notes.lead_id -> b2b_leads.id`
- `addresses.user_id -> auth/profile user id`

## RLS and Write Risk

RLS/security migrations are visible and must be verified live before enabling
`real_read_only`.

Write-risk operations documented only:

- `admin_update_order_state`
- `seller_update_order_item_fulfillment`
- `create_verified_review`
- `update_verified_review`
- insert/update/delete/upsert paths

CornerOps does not execute these paths in v1.1.3.
