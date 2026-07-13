# SupplyGraph data foundation v1.10

SupplyGraph is a private CornerOps domain inside `cornerops_internal`. It records evidence; it does not
rank suppliers, generate quotes, negotiate, purchase, contact anyone or mutate CornerMex.

## Model

- `supplier_profiles`: canonical supplier identity. v1.10 creates only Intermex UAE.
- `supplier_catalog_items`: stable identities per supplier, independent of CornerMex products.
- `supplier_offer_snapshots`: append-only commercial observations with source and observed time.
- `demand_requests`: sanitized, opaque B2B sourcing needs with optimistic versions.
- `demand_items`: structured product requirements; active items are never physically deleted.

Unknown facts remain `NULL` or `unknown`. Observation age is measured against
`SUPPLYGRAPH_OBSERVATION_STALE_AFTER_HOURS` (default 168). Old observations are not current stock truth.

## Runtime flow

1. Existing operator middleware protects all reads.
2. Existing Founder Action middleware additionally protects POST/PATCH.
3. `SupplyGraphService` enforces kill switches.
4. `IntermexCatalogSynchronizer` reads one checksum-pinned local snapshot without network access.
5. `SupplyGraphStore` reuses the existing restricted PostgreSQL pool, transaction helper and audit table.
6. `DemandIntakeService` normalizes deterministically, sanitizes PII and calculates missing fields.
7. Existing Work Queue receives scoped internal-review conditions with deterministic idempotency.

## Truth and safety states

Status is `ready`, `partial`, `unavailable` or `configuration_required`; failed queries never become
invented zero counts. Matching and quote generation are `not_implemented`. Supplier outreach,
autonomous purchasing, external actions, product activation and CornerMex writes are blocked.
