# CornerMex Products Import v1 Notes

Generated: 2026-07-09T19:38:46.713Z

## Source

- Source repo: Conquereleven/corner-mex-uae
- Source file: `supabase/migrations/20260609020000_product_seo_batch.sql`
- Source type: committed Supabase migration containing SEO/product translation updates.
- Extracted product rows: 150

## Field Mapping

| CSV field | Source | Status |
| --- | --- | --- |
| sku | Not available in SEO migration | missing |
| name | English product translation | available |
| category | SEO category slug | available |
| price_aed | Not available in SEO migration | missing |
| description | English product translation description | available |
| image_url | Not available; source includes alt text but no image URL | missing |
| stock_quantity | Not available in SEO migration | missing |
| status | Source migration targets active products | assumed active |
| supplier | Not available as structured field | missing |

## Assumptions

- Rows are marked `active` because the source migration validates active product SEO coverage.
- SKU, price, stock, image URL, and supplier are intentionally blank because they were not present in the extracted source.
- No products were invented. Every row is tied to an existing product UUID from the source migration.
- The expected count mentioned during planning was about 149, but this committed migration contains 150 products. The CSV preserves the source count instead of dropping a row.

## Missing Fields Before Import

- `sku`
- `price_aed`
- `image_url`
- `stock_quantity`
- `supplier`

## Readiness

Status: not ready for production import.

Reason: the extracted catalog has names, categories, descriptions, and active status, but import-critical commercial fields are missing. Complete the missing fields or map them from a confirmed existing source before executing any upsert.
