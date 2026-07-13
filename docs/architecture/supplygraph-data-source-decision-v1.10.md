# SupplyGraph data source decision v1.10

## Decision

- Selected source: `docs/data/cornermex-products-master-enriched-from-intermex.csv`
- Source type: `repo_catalog_snapshot`
- Supplier represented: Intermex UAE
- SHA-256: `90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934`
- Verified cohort: 190 rows
- Observation timestamp: `2026-07-11T05:12:18.000Z`, derived from the immutable source commit
- Network calls during API sync: none

The source was generated from the Intermex UAE product endpoint and committed in PR #43. The
committed checksum, 191 physical CSV lines including the header, and parser result of 190 valid rows
make it authoritative enough for an initial versioned supplier-catalog observation. It is not a live
inventory or supplier promise.

## Trusted fields

- supplier catalog identity
- supplier SKU when present
- source product ID when present
- display and normalized product name
- category when present
- pack/unit evidence parsed directly from the product name
- AED unit price observed in the snapshot
- source URL and checksum

## Explicitly untrusted or unknown

- The CSV `stock=50` value was synthetic enrichment output. SupplyGraph discards it.
- `stock_status` is stored as `unknown`.
- `stock_quantity`, MOQ, lead time, shelf life, valid-until and temperature zone remain `NULL`.
- Product active/B2B flags are not imported and cannot activate CornerMex products.
- Compliance, labels, import eligibility and real-time availability are unknown.
- Supplier legal identity is not inferred.

## Refresh strategy

A new reviewed repository snapshot must be created outside the API request, committed with provenance,
and configured with its checksum. The synchronizer rejects checksum drift. A new offer snapshot is
appended only when a material commercial fact changes; regenerated timestamps or row order do not
create observations. Live scraping, API-request crawling and forced 190-row expectations are forbidden.
