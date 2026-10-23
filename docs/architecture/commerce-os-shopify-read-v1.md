# Commerce OS Shopify read connector v1

This block replaces the Shopify simulator at the integration boundary without changing the canonical
order contract. It is deliberately one-way: Shopify is read through the versioned Admin GraphQL API,
while order intake persists only inside CornerOps. The connector contains no GraphQL mutation and
reports `externalWritesAllowed: false` in every operating state.

## Data paths

Incremental reconciliation starts from a caller-owned confirmed timestamp, filters orders by
`updated_at`, follows Shopify cursors, and advances the checkpoint only after every returned order has
completed durable canonical intake. Existing source timestamps and fingerprints make retries safe.
An order with more than 250 line items fails closed rather than creating an incomplete order.

Webhook delivery uses the raw request bytes. Before JSON parsing or intake it verifies the Shopify
HMAC with a constant-time comparison, checks the exact `myshopify.com` tenant domain, restricts topics
to `orders/create` and `orders/updated`, and deduplicates by Shopify event ID (falling back to delivery
ID). The default replay store is process-local; production composition must inject a durable shared
store before horizontally scaling webhook workers.

## Activation controls

The connector and webhook path have separate, default-off kill switches. Health checks are also
read-only and sanitize failures so access tokens and response bodies never appear in their result.
Tenant onboarding requires a Shopify token with the minimum `read_orders` scope. Access beyond the
default order history window remains a separate merchant/app approval decision.

## Deferred on purpose

- Shopify OAuth and token rotation
- webhook subscription creation or mutation
- shared durable replay storage for multiple workers
- orders exceeding 250 line items
- Zoho, fulfillment, payment, notification, or customer-facing writes
