# CornerMex Supabase Migration Discovery v1.1.3

## Source

- Repo: `Conquereleven/corner-mex-uae`
- Discovery mode: read-only repo evidence.
- Generated schema evidence: `src/integrations/supabase/types.ts`
- Migration path: `supabase/migrations`
- Migrations executed: no.
- Production DB connected: no.

## Migration Files Discovered

The repo contains Supabase migrations from `20260521030516_...sql` through `20260613163854_...sql`. v1.1.3 records representative migration evidence and does not execute any SQL.

## Tables and Contracts

- Product: `products`, `product_variants`, `categories`
- Lead: `b2b_leads`, `lead_notes`, `lead_status_history`
- Quote: currently inferred from B2B lead/quote status evidence; needs live schema confirmation.
- Order: `orders`, `order_items`, `order_events`, `order_notes`
- Customer: `profiles`, `addresses`
- Payment: `orders.payment_method`, `orders.payment_status`, `paid_at`; dedicated payments table remains unconfirmed.

## RLS and Write-Risk Evidence

- RLS/security migrations are present, including security hardening and secure order-state RPC migrations.
- Write-risk RPCs documented only:
  - `admin_update_order_state`
  - `seller_update_order_item_fulfillment`
  - `create_verified_review`
  - `update_verified_review`
- CornerOps does not call these RPCs in v1.1.3.

## Confidence

- Repo/migration evidence: medium.
- Live Supabase read-only schema: pending.
- Unsafe write config: blocked.

## Recommended Config

Use only:

```env
CORNERMEX_SUPABASE_URL=
CORNERMEX_SUPABASE_ANON_KEY=
CORNERMEX_SUPABASE_READ_ONLY=true
CORNERMEX_SUPABASE_ALLOW_WRITES=false
CORNERMEX_SUPABASE_BLOCK_MUTATIONS=true
```
