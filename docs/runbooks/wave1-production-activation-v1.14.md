# Wave 1 Production Activation v1.14

## Production State

Wave 1 is live with 14 seller profiles, seven catalog-ready sellers, 489 catalog products, 489 initialized inventory rows and private managed media for all 278 discovered official image references. Capture remains disabled in Railway.

## Runtime Flags

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

## Private Media

Apply only the reviewed migration `20260713190000_supplygraph_private_seller_media_bucket_v114.sql`. The bucket must remain private, accept only JPEG/PNG/WebP up to 5 MB and expose no public object policy. Media import must validate host, MIME, magic bytes, size and checksum before appending evidence and audit records.

Never place a Supabase key in source, logs, CI output or frontend configuration. Delete ephemeral local credential material immediately after an offline import.

## Verification

1. Confirm `/api/health` and the four SupplyGraph SPA routes return HTTP 200.
2. Confirm 14 profiles, seven catalog-ready sellers and 489 products.
3. Confirm 278 unique managed paths, 278 imported media records and zero pending image sources.
4. Confirm 489 inventory rows, 48,900 operational units and zero physically verified rows.
5. Repeat the sanitized multi-seller match and confirm idempotent run reuse.
6. Confirm Work Queue and Approval records remain `executed:false` and externally blocked.
7. Restart/deploy once and compare durable IDs and counts.
8. Run CornerMex read-only checks and confirm unchanged business counts.

## Rollback

Disable frontend serving, comparison, inventory, media and Wave 1 application flags, then redeploy. Keep capture disabled. Do not delete packages, catalog history, media evidence, inventory ledger, match runs, approvals, Work Queue records or audits. Revoking media access means disabling the feature and access path, not making the bucket public.
