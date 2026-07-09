-- CornerOps AI v1.5 - CornerMex real data manual admin import template
--
-- Purpose:
--   Prepare reviewed seed/onboarding records for CornerMex operational data.
--   This SQL is for a founder/admin to review and run manually in Supabase SQL
--   Editor if the matching tables exist. It is not executed by CornerOps.
--
-- Safety:
--   - Do not paste service_role keys into this file.
--   - Do not run this from CornerOps runtime.
--   - No drop, truncate or destructive statements.
--   - Keep PII minimal and masked.
--   - Review table names against the actual CornerMex schema before use.
--
-- NOTE:
--   The current CornerOps runtime reads only through:
--     cornerops_products_v
--     cornerops_b2b_leads_v
--     cornerops_orders_v
--     cornerops_customers_v
--     cornerops_payments_v
--     cornerops_fulfillment_v
--
--   The base write tables behind those views are intentionally not assumed in
--   this template. Replace the reviewed target table names below only after the
--   founder confirms the actual CornerMex schema.

begin;

-- Example products import. Replace public.products only after schema review.
-- insert into public.products (id, sku, name, category, price, currency, stock, image_url, description, status, updated_at)
-- values
--   ('prod_demo_tajin', 'CMX-TAJIN-142', 'Tajin Clasico 142g', 'seasoning', 9.50, 'AED', 48, 'https://example.test/tajin.jpg', 'Chili lime seasoning for retail and B2B', 'active', now())
-- on conflict (id) do update set
--   sku = excluded.sku,
--   name = excluded.name,
--   category = excluded.category,
--   price = excluded.price,
--   currency = excluded.currency,
--   stock = excluded.stock,
--   image_url = excluded.image_url,
--   description = excluded.description,
--   status = excluded.status,
--   updated_at = excluded.updated_at;

-- Example B2B lead import. Replace public.b2b_leads only after schema review.
-- insert into public.b2b_leads (id, company_name, lead_type, status, interest_summary, requested_products, last_contacted_at, next_follow_up_at, created_at, updated_at)
-- values
--   ('lead_demo_restaurant', 'Dubai Taco Kitchen', 'restaurant', 'warm', 'Interested in Tajin and Valentina', array['Tajin','Valentina'], now(), now() + interval '7 days', now(), now())
-- on conflict (id) do update set
--   company_name = excluded.company_name,
--   lead_type = excluded.lead_type,
--   status = excluded.status,
--   interest_summary = excluded.interest_summary,
--   requested_products = excluded.requested_products,
--   last_contacted_at = excluded.last_contacted_at,
--   next_follow_up_at = excluded.next_follow_up_at,
--   updated_at = excluded.updated_at;

-- Example order/payment/fulfillment imports should be added only after the
-- founder confirms target table names, required foreign keys and acceptable
-- manual payment evidence fields.

rollback;

-- Keep rollback by default. Change to commit only after founder/admin review.
