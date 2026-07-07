# CornerMex Read-Only Views v1.4.4

## Why Activation Is Blocked

CornerOps can authenticate to the configured CornerMex Supabase project with a safe publishable key, but the public Data API cannot find any expected CornerOps read model.

Current local check classification:

- `supabaseStatus`: `connected_no_public_read_model`
- `readModelStatus`: `missing_public_read_model`
- `actionRequired`: `create_cornerops_readonly_views`

This means the blocker is not Railway auth and not a service-role/key safety issue. The selected project needs reviewed public read views or an explicit table map.

## What Public Read Views Are

Public read views are narrow, reviewed SQL views that expose only the operational fields CornerOps needs. They let CornerOps read useful summaries without direct access to write paths or unnecessary PII.

Target views:

- `cornerops_products_v`
- `cornerops_b2b_leads_v`
- `cornerops_orders_v`
- `cornerops_customers_v`
- `cornerops_payments_v`
- `cornerops_fulfillment_v`

CornerOps tries sources in this order:

1. `CORNERMEX_SUPABASE_TABLE_MAP_JSON` or entity-specific env overrides.
2. Default `cornerops_*_v` read views.
3. Legacy table names such as `products`, `b2b_leads`, and `orders`.

## How To Review And Run The SQL

1. Open Supabase SQL Editor for the CornerMex project.
2. Open `docs/supabase/cornermex-readonly-views.v1.4.4.sql`.
3. Replace every placeholder such as `<base_products_table>` with the actual base table name.
4. Remove fields that do not exist in the base table.
5. Keep raw PII out of the views. Use masked values where needed.
6. Review RLS and Data API exposure.
7. Run the SQL manually only after review.

Do not use a service-role key in CornerOps.

## Optional Table Map

If the reviewed views use custom names, set:

```env
CORNERMEX_SUPABASE_TABLE_MAP_JSON={"products":"cornerops_products_v","b2bLeads":"cornerops_b2b_leads_v","orders":"cornerops_orders_v","customers":"cornerops_customers_v","payments":"cornerops_payments_v","fulfillment":"cornerops_fulfillment_v"}
```

The map is optional when default view names are used.

## Rerun The Local Check

After creating/reviewing the views:

```bash
npm run supabase:key-compatibility-check
npm run cornermex:supabase-readonly-check
```

Proceed only if at least one entity reports:

- `available`
- `available_empty`
- `available_masked`

## Railway Deploy Gate

Do not configure Railway or redeploy until the local read-only check reports `real_read_only` or `real_read_only_partial`.

When the local gate passes, the next deploy sprint can configure Railway variables and verify:

- `/api/health`
- `/api/control-tower/frontend/v1/status`
- `/api/control-tower/frontend/v1/cornermex`
- `/api/control-tower/frontend/v1/flows`

Writes, external sends, customer channels, and OpenClaw remain disabled.
