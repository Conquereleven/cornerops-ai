# Acceptance v1.6.2: Catalog Read Model Reconciliation

## Branch

`feature/catalog-read-model-reconciliation-v1.6.2`

## Scope

Investigate why CornerOps sees `9` readable products while the founder expects approximately `149` products for CornerMex pre-launch review.

## Result

Final status: `catalog_read_model_partial`

The mismatch remains unresolved because no read-only visible product-related source confirms `149` product rows.

## Evidence

Read-only checks show:

- `sourceMode`: `real_read_only`
- `dataSource`: `cornermex_supabase`
- `cornerops_products_v`: `9` readable product rows
- `products`: `0` readable rows
- `product_translations`: `missing_table`
- `product_variants`: `missing_table`
- `catalog_events`: `missing_table`
- `import_batches`: `missing_table`
- `product_imports`: `missing_table`
- `catalog_imports`: `missing_table`

Founder Review now supports expectation context:

- `CORNERMEX_EXPECTED_PRODUCT_COUNT=149`
- `expectedFounderProductCount`: `149`
- `readableProductCount`: `9`
- `productCountMismatch`: `true`
- `catalogReadModelStatus`: `partial`

The expectation does not override live read-only truth.

## Safety

- No writes enabled
- No Supabase runtime writes
- No service-role use
- No SQL executed
- No fake data imported
- No product rows printed
- No raw PII exposed
- No Lovable project updated directly
- External sends remain blocked

## Commands

Validation commands for this sprint:

```bash
npm run cornermex:supabase-readonly-check
npm run cornermex:catalog-read-report
CORNERMEX_OPERATING_STAGE=pre_launch CORNERMEX_LAUNCH_DATE=2026-08-17 CORNERMEX_EXPECTED_PRODUCT_COUNT=149 npm run founder:review
npm run lint
npm run typecheck
npm test -- tests/catalogReadModelV162.test.js tests/founderReviewV161.test.js tests/cornermexSupabaseReadOnlyV14.test.js
git diff --check
```

## Founder Manual Action

Confirm where the missing expected products live:

1. Supabase source table not currently visible to read-only key
2. Lovable static/front-end catalog
3. Import file or pending import batch
4. Product variants/translations table not exposed to Data API
5. Product status/published filters in `cornerops_products_v`

Do not treat launch readiness as final until the catalog count is reconciled.
