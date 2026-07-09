# CornerMex Catalog Read Model Reconciliation v1.6.2

## Summary

CornerOps can read the CornerMex Supabase public read model in `real_read_only` mode, but the product catalog count does not match the founder expectation.

- Expected founder product count: approximately `149`
- Current readable product count: `9`
- Primary readable source: `public.cornerops_products_v`
- Base product table evidence: `public.products` is readable but currently returns `0` rows through the anon/read-only path
- Final diagnostic status: `catalog_read_model_partial`

No writes, migrations, imports, service-role credentials, or destructive SQL were executed.

## Evidence

Command:

```bash
CORNERMEX_EXPECTED_PRODUCT_COUNT=149 npm run cornermex:catalog-read-report
```

Observed sanitized output:

| Source | Type | Availability | Exact row count | Notes |
| --- | --- | ---: | ---: | --- |
| `cornerops_products_v` | configured product read model | `available_masked` | `9` | Primary source used by CornerOps Founder Review |
| `products` | configured/base product source | `available_empty` | `0` | Readable, but empty through current anon/read-only access |
| `product_translations` | translation table candidate | `missing_table` | unknown | Not visible in schema cache |
| `product_variants` | variant table candidate | `missing_table` | unknown | Not visible in schema cache |
| `catalog_events` | catalog event table candidate | `missing_table` | unknown | Not visible in schema cache |
| `import_batches` | import metadata candidate | `missing_table` | unknown | Not visible in schema cache |
| `product_imports` | import table candidate | `missing_table` | unknown | Not visible in schema cache |
| `catalog_imports` | import table candidate | `missing_table` | unknown | Not visible in schema cache |

Readable product quality evidence from `cornerops_products_v`:

- sampled rows: `9`
- active/status evidence: `9` active rows
- price field: available, `0` sampled missing/suspicious price
- stock field: available, `0` sampled missing stock
- image field: unavailable in current readable view
- distinct product IDs in sample: `9`

## Likely Mismatch Reason

The current primary public read model `cornerops_products_v` is readable, but it exposes only `9` product rows. No currently visible read-only product-related source confirms the founder expectation of approximately `149` products.

The missing products may be:

- not imported into Supabase yet
- stored in a different table not exposed to the Data API
- stored in Lovable/static frontend data instead of the live Supabase project
- filtered out by the current read-only view definition
- filtered by product status/published flags not represented in the current read model
- hidden by RLS/grants/Data API exposure

## Recommended Fix

Founder or database owner should verify where the remaining products live:

1. Confirm whether the full CornerMex catalog exists in Supabase.
2. If it exists, identify the real source table/view and status fields.
3. If it is static in Lovable or import files, import or map it into a reviewed Supabase read model.
4. Update `cornerops_products_v` only after confirming the intended launch catalog source.
5. Keep launch readiness partial until the readable catalog count is reconciled.

## Launch Readiness Impact

Founder Review may use `CORNERMEX_EXPECTED_PRODUCT_COUNT=149` as expectation context, but it must not use `149` as live truth.

Current behavior:

- `expectedFounderProductCount`: `149`
- `readableProductCount`: `9`
- `productCountMismatch`: `true`
- `catalogReadModelStatus`: `partial`
- launch readiness should not be presented as final

## Safety

- Read-only checks only
- No writes
- No Supabase runtime mutations
- No service-role key use
- No raw PII
- No product rows printed
- No imports or fake product rows
- No Lovable project update
