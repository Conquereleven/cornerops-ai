# Wave 1 Catalog Activation Decision v1.14

## Decision

Activate only products observed on official public seller sources. Reuse the v1.13 onboarding, Approval, Work Queue, media, inventory, matching, audit and PostgreSQL boundaries. No migration is required.

## Scope

- Exactly 14 Wave 1 sellers, in the founder-defined deterministic order.
- Intermex is reused without destructive import or inventory reset.
- Six new catalogs are supported by current official sources: La Tiendita, Maiz Tacos, FreshOnTable, Greenheart Organic Farms, Emirates Bio Farm and Burro Blanco.
- Other sellers remain profile-only with explicit blockers; no suggested pipeline item becomes catalog truth.
- Search pages are navigation aids and are rejected as product evidence.

## Product Semantics

- Grocery and farm storefront listings remain seller-specific catalog items.
- Restaurant menu entries remain `restaurant_menu_item` and use `public_menu_price`.
- Storefront prices use `public_web_price`; neither means wholesale, negotiated, landed or purchase cost.
- The strongest identity is seller plus official ID, SKU, source URL, then normalized identity.
- Cross-seller equivalents are comparable but never collapsed into one seller listing.

## Evidence And Capture

- Capture is an explicit offline operation. Runtime APIs never crawl seller websites.
- One shared request, sanitizer, normalizer and checksum path powers small seller adapters.
- Limits: 250 products per seller, 1,500 new Wave 1 products, three requests concurrently, one retry, one-second domain delay.
- Snapshot and product evidence are checksum-pinned. Path traversal, checksum drift and mismatched identity fail closed.

## Media And Inventory

- Official images are eligible for the existing `seller_product_media` model and `seller-product-assets` bucket.
- Missing images do not block products and never receive borrowed or fabricated replacements.
- Every newly applied product receives one idempotent +100 operational seed.
- Stock source is `cornerops_operational_inventory`; initialization source is `founder_authorized_initialization`; `physicalCountVerified=false`.
- Intermex inventory remains on the v1.13 idempotency namespace.

## Comparison

Seller comparison may evaluate multiple catalog-ready authorized sellers. Market comparison, market completeness and best-seller claims remain false. Media-only changes do not alter commercial fingerprints or ranking.

## Deferred Work

Basket Optimization remains deferred to v1.15 because catalog coverage, comparable units, fulfillment evidence and physical stock verification are not broad enough.

## Frontend And Lovable

The repository frontend already contains the routes, client and design system. Same-service Railway hosting is the smallest safe delivery. Lovable is `not_required`; its single-pass prompt remains prepared but unsent, avoiding one credit and permission churn.

## Rollback

Disable Wave 1 application, capture, media, inventory, comparison and frontend-serving flags. Preserve catalogs, media evidence, ledgers, approvals, Work Queue, audit and historical matches.
