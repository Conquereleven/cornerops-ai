# CornerMex Real Data Onboarding v1.5

This guide prepares real operational data for CornerOps AI without enabling runtime writes.

CornerOps remains read-only. Any import is a manual founder/admin Supabase action, reviewed outside the CornerOps runtime.

## Current Read-Only Status

- Source mode: `real_read_only`
- Supabase status: `connected`
- Read model: available
- PII masking: enabled
- Writes and external sends: blocked

Current views:

- `cornerops_products_v`
- `cornerops_orders_v`
- `cornerops_customers_v`
- `cornerops_b2b_leads_v`
- `cornerops_payments_v`
- `cornerops_fulfillment_v`

`anomaly_events` is a future ingestion contract in v1.5. Live anomaly sync is not enabled.

## Templates

Use these CSV templates with fake columns/examples as the minimum data shape:

- `data/cornermex/onboarding-v1.5/products.template.csv`
- `data/cornermex/onboarding-v1.5/inventory.template.csv`
- `data/cornermex/onboarding-v1.5/b2b_leads.template.csv`
- `data/cornermex/onboarding-v1.5/orders.template.csv`
- `data/cornermex/onboarding-v1.5/order_items.template.csv`
- `data/cornermex/onboarding-v1.5/payments.template.csv`
- `data/cornermex/onboarding-v1.5/fulfillment.template.csv`

## Required Fields

### Products

`product_id`, `sku`, `name`, `category`, `price`, `currency`, `stock`, `status`, `updated_at`

Useful optional fields: `image_url`, `description`.

### Inventory

`inventory_id`, `product_id`, `sku`, `stock`, `reorder_threshold`, `warehouse`, `updated_at`

### B2B Leads

`lead_id`, `company_name`, `lead_type`, `status`, `interest_summary`, `requested_products`, `created_at`, `updated_at`

Useful optional fields: `last_contacted_at`, `next_follow_up_at`.

### Orders

`order_id`, `order_number`, `status`, `payment_method`, `payment_status`, `fulfillment_status`, `total_amount`, `currency`, `created_at`, `updated_at`

### Order Items

`order_item_id`, `order_id`, `product_id`, `sku`, `name`, `quantity`, `unit_price`, `currency`

### Payments

`payment_id`, `order_id`, `payment_method`, `payment_status`, `amount`, `currency`, `requires_manual_review`, `created_at`, `updated_at`

### Fulfillment

`fulfillment_id`, `order_id`, `fulfillment_status`, `tracking_status`, `requires_attention`, `created_at`, `updated_at`

### Anomaly Events

Future contract only:

`anomaly_key`, `type`, `severity`, `status`, `title`, `description`, `evidence`, `hypotheses`, `suggested_action`, `emirate_code`, `emirate_name`, `product_id`, `product_slug`, `confidence_score`, `first_detected_at`, `last_detected_at`, `source`

## Safety Rules

- Do not import raw customer PII unless explicitly needed and approved.
- Prefer masked emails and operational business fields.
- Do not import service-role keys or credentials.
- Do not run SQL from CornerOps runtime.
- Keep all CornerOps reads through public reviewed read-only views.
- Keep WhatsApp/email/customer sends disabled.
