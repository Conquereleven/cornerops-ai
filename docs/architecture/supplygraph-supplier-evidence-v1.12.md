# SupplyGraph Supplier Evidence v1.12

## Model

Engine identity: `supplygraph-evidence-v1.12.0`. The immutable ruleset checksum is exposed by the API and status service.

The private `cornerops_internal` schema adds:

- `supplier_evidence_packages`: review, approval and lifecycle boundary.
- `supplier_fact_observations`: append-only field facts.
- `supplier_evidence_applications`: append-only application outcomes.

Supported facts are price, stock status, stock quantity, minimum order, lead-time days, shelf-life days and temperature zone. Every fact carries supplier/catalog ownership, observation time, optional expiry, source type/reference/checksum, verification status and evidence scope.

## Lifecycle

1. A bounded package is validated and persisted idempotently.
2. One Work Queue review and one pending Approval are linked.
3. Preview resolves current versus proposed evidence and returns a deterministic fingerprint.
4. Founder Approval is decided through the existing Approval Engine.
5. Apply requires the current package version and exact preview fingerprint.
6. Material production changes create a separate internal rematch-review item.

Apply remains `executed:false`; external actions remain blocked.

## Resolution

Only applied production evidence is eligible. Expired, pending, rejected, cancelled and acceptance-test observations are historical only. Explicit unknowns remain unknown. Conflicts are never averaged and receive no positive confidence credit.

Each resolved field exposes its selected fact ID, package ID, source metadata, verification status and reason. The evidence watermark hashes only resolved material facts, so row order, notes and correlation IDs cannot alter a match fingerprint.

## Readiness

Status reports package/fact counts, coverage, conflicts, expiry, model/checksum and truthful supplier readiness. Multi-supplier comparison requires at least two verified suppliers with comparable, fresh commercial evidence; v1.12 remains `false`. Basket optimization is `not_implemented`.
