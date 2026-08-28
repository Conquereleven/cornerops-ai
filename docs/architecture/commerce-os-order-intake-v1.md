# Commerce OS canonical order intake v1

The canonical order contract is the first executable Commerce OS vertical slice. It separates a
storefront payload from commercial operations so Shopify, marketplaces, CSV imports and future B2B
portals can share one downstream workflow.

## Boundary

`source adapter -> canonical order -> assessment -> durable intake -> later orchestration`

The intake stage performs no external writes, payment capture or customer communication. Raw
Shopify payloads are not retained by the simulator. Money is represented as integer minor units and
every record carries tenant, source identity, source version and provenance.

## Outcomes

- `accepted`: structurally complete and consistent with the tenant profile.
- `approval_required`: safe to retain, but missing SKU/delivery facts or inconsistent totals need a
  human decision.
- `configuration_required`: valid source data cannot proceed under the tenant configuration, such
  as an unsupported currency.
- `rejected`: malformed identity, timestamps, quantities or money; no new record is stored.

The stable identity is `tenantId + source system + external order ID`. An identical payload is an
idempotent replay. A changed payload is accepted only when its source timestamp is newer, preserving
one identity and incrementing its revision. Stale conflicts fail closed.

## Next implementation

Replace the in-memory intake store with tenant-scoped PostgreSQL persistence and audit events, then
add a read-only Shopify adapter using the same normalization contract. External Zoho drafts remain a
later, separately approved orchestration step.
