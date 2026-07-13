# Wave 1 Production Activation v1.14

## Preconditions

1. Implementation PR merged with green CI.
2. Snapshot validator passes for all 13 non-Intermex sellers.
3. Full validation and secret scan pass.
4. Supabase migration result is `migration_not_required_existing_schema_sufficient`.

## Capture

```bash
SUPPLYGRAPH_SELLER_CAPTURE_ENABLED=true npm run supplygraph:capture-wave1
```

Review `capture-report.json` and each checksum-pinned snapshot. Never apply a blocked, conflicted or unverified package.

## Production Flags

```env
SUPPLYGRAPH_WAVE1_CATALOG_ACTIVATION_ENABLED=true
SUPPLYGRAPH_SELLER_CAPTURE_ENABLED=false
SUPPLYGRAPH_SELLER_MEDIA_ENABLED=true
SUPPLYGRAPH_SELLER_INVENTORY_ENABLED=true
SUPPLYGRAPH_MULTI_SELLER_COMPARISON_ENABLED=true
CORNEROPS_FRONTEND_SERVE_ENABLED=true
SUPPLYGRAPH_INITIAL_PRODUCT_STOCK=100
SUPPLYGRAPH_MAX_PRODUCTS_PER_SELLER=250
SUPPLYGRAPH_MAX_TOTAL_WAVE1_PRODUCTS=1500
SUPPLYGRAPH_MAX_IMAGES_PER_PRODUCT=3
```

Capture remains disabled in the runtime deployment.

## Apply Order

For each valid snapshot: create extension package, inspect preview, approve linked request, apply package, import validated media and confirm one inventory seed per new product. Intermex is regression-only.

Synchronize aggregate Work Queue tasks after all sellers are evaluated.

## Acceptance

Verify health, five SPA routes, live APIs, managed media, inventory provenance and one multi-seller match. Restart once and compare durable IDs/counts. Run CornerMex read-only checks.

## Rollback

Disable Wave 1 application, capture, media, inventory, comparison and frontend serving in that order. Redeploy. Never delete history, media evidence or ledgers.
