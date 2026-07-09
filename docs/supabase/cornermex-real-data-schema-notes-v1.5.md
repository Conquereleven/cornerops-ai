# CornerMex Real Data Schema Notes v1.5

The v1.5 onboarding layer does not assume writable base tables.

## Current Read Model

The backend can read these public read views:

| Contract | View | Fields currently expected |
| --- | --- | --- |
| Product | `cornerops_products_v` | `id`, `name`, `sku`, `category`, `price`, `currency`, `stock`, `image_url`, `description`, `status`, `updated_at` |
| B2B Lead | `cornerops_b2b_leads_v` | `id`, `company_name`, `lead_type`, `status`, `interest_summary`, `requested_products`, `last_contacted_at`, `next_follow_up_at`, `created_at`, `updated_at` |
| Order | `cornerops_orders_v` | `id`, `order_number`, `status`, `payment_method`, `payment_status`, `fulfillment_status`, `total_amount`, `currency`, `created_at`, `updated_at` |
| Customer | `cornerops_customers_v` | `id`, `name`, `masked_email`, `customer_type`, `last_order_at`, `created_at`, `updated_at` |
| Payment | `cornerops_payments_v` | `id`, `order_id`, `payment_method`, `payment_status`, `amount`, `currency`, `requires_manual_review`, `reviewed_at`, `created_at`, `updated_at` |
| Fulfillment | `cornerops_fulfillment_v` | `id`, `order_id`, `fulfillment_status`, `carrier`, `tracking_status`, `requires_attention`, `created_at`, `updated_at` |

## Missing or Pending

- `order_items` is not currently represented as a dedicated public read view.
- `inventory` is represented through product `stock`; a richer inventory view is future work.
- `anomaly_events` is not live in the CornerOps read-only connector in v1.5.
- Live anomaly case persistence is not enabled.

## Recommended Future Views

- `cornerops_order_items_v`
- `cornerops_inventory_v`
- `cornerops_anomaly_events_v`

All future views should be reviewed for:

- `security_invoker = true`
- minimal PII
- explicit grants only after review
- RLS-safe base tables
- no service-role use in CornerOps
