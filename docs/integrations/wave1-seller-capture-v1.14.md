# Wave 1 Seller Capture v1.14

## Offline Command

```bash
SUPPLYGRAPH_SELLER_CAPTURE_ENABLED=true npm run supplygraph:capture-wave1
```

The command is administrative and offline. It reads bounded official sources, writes only pinned repository snapshots and never deploys, contacts sellers, submits forms, creates accounts or mutates CornerMex.

## Shared Capture Layer

`Wave1CatalogCaptureService` provides official-host validation, bounded fetch, sanitization, normalization and SHA-256 evidence. `wave1CaptureAdapters` contains 13 small seller definitions.

Supported source parsers:

- public WooCommerce Store API
- public Shopify storefront product JSON
- official HTML menu with evidence-verified items

Unsupported or blocked sources produce zero products and a deterministic blocker.

## Limits

- maximum one page per current adapter
- maximum 250 products per seller
- maximum 1,500 products across Wave 1
- maximum three image references per product
- no retry for 401, 403, login, CAPTCHA or explicit bot rejection

## Truth Boundary

Public menu items remain menu items. Retail prices remain public web prices. No availability, wholesale cost, pack size, SKU or stock is inferred.
