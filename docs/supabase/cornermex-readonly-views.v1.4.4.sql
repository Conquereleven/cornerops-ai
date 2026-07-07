-- CornerOps AI v1.4.4 - CornerMex public read model views
--
-- Purpose:
--   Create reviewed, read-only public views that CornerOps can query with a
--   publishable/anon client key. Review and replace every <base_*_table>
--   placeholder before running this file in Supabase SQL Editor.
--
-- Safety:
--   - Do not use service_role in CornerOps.
--   - Keep writes disabled in CornerOps.
--   - Prefer RLS-enabled base tables and security_invoker views.
--   - Do not expose raw customer PII. Mask or omit it.
--   - Grants below are commented and must be reviewed before use.

-- Products needed by CornerOps for product quality and catalog readiness.
create or replace view public.cornerops_products_v
with (security_invoker = true)
as
select
  id,
  name,
  sku,
  category,
  price,
  currency,
  stock,
  image_url,
  description,
  status,
  updated_at
from public.<base_products_table>;

-- B2B leads needed by CornerOps for follow-up and pipeline review.
create or replace view public.cornerops_b2b_leads_v
with (security_invoker = true)
as
select
  id,
  company_name,
  lead_type,
  status,
  interest_summary,
  requested_products,
  last_contacted_at,
  next_follow_up_at,
  created_at,
  updated_at
from public.<base_b2b_leads_table>;

-- Orders needed by CornerOps for attention and fulfillment review.
create or replace view public.cornerops_orders_v
with (security_invoker = true)
as
select
  id,
  order_number,
  status,
  payment_method,
  payment_status,
  fulfillment_status,
  total_amount,
  currency,
  created_at,
  updated_at
from public.<base_orders_table>;

-- Customers needed by CornerOps for internal follow-up only.
-- Email is masked to avoid exposing raw customer PII to the operator surface.
create or replace view public.cornerops_customers_v
with (security_invoker = true)
as
select
  id,
  name,
  case
    when email is null then null
    when position('@' in email) = 0 then 'masked'
    else concat(left(email, 2), '***@', split_part(email, '@', 2))
  end as masked_email,
  customer_type,
  last_order_at,
  created_at,
  updated_at
from public.<base_customers_table>;

-- Payments needed by CornerOps for manual payment review.
create or replace view public.cornerops_payments_v
with (security_invoker = true)
as
select
  id,
  order_id,
  payment_method,
  payment_status,
  amount,
  currency,
  requires_manual_review,
  reviewed_at,
  created_at,
  updated_at
from public.<base_payments_table>;

-- Fulfillment summary needed by CornerOps for operational review.
create or replace view public.cornerops_fulfillment_v
with (security_invoker = true)
as
select
  id,
  order_id,
  fulfillment_status,
  carrier,
  tracking_status,
  requires_attention,
  created_at,
  updated_at
from public.<base_fulfillment_table>;

-- Optional grants, review before uncommenting.
-- grant select on public.cornerops_products_v to anon, authenticated;
-- grant select on public.cornerops_b2b_leads_v to anon, authenticated;
-- grant select on public.cornerops_orders_v to anon, authenticated;
-- grant select on public.cornerops_customers_v to anon, authenticated;
-- grant select on public.cornerops_payments_v to anon, authenticated;
-- grant select on public.cornerops_fulfillment_v to anon, authenticated;
