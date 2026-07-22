# Commercial Operations Core v1.17A

## Operating loop

`Account -> Opportunity -> Quote -> Founder approval -> Order -> Payment evidence -> Intermex handoff -> Warehouse fulfillment -> Carrier delivery -> Exception -> Daily close`

PostgreSQL remains authoritative. `commercial_entities` stores current internal state keyed by
entity type and stable key. `commercial_transition_events` and the existing audit log preserve the
actor, timestamp, previous state, new state, reason and sanitized evidence.

## Contracts

Accounts and SKUs use the fields defined by the Commercial Input Pack. Unknown costs, prices,
inventory, registration, MOQ and availability remain `unknown`, `not_provided` or
`pending_verification`. Contact PII is not exposed by general frontend summaries.

Opportunity, quote, order, fulfillment and exception states are immutable source constants.
Transitions are allowlisted. Quote review is blocked by missing SKU, quantity, currency, price,
price source, shipping evidence or commercial authorization. Quote export remains
`DRAFT_NOT_SENT`; only a human can confirm a manual send.

CornerMex is the commercial owner. Intermex UAE is the warehouse custodian and fulfillment
provider. The carrier is a separate party and may be unknown. CornerOps records approvals,
manual/imported evidence and reconciliation; it does not pick, pack, dispatch or call an Intermex
API. There is no automated CornerOps-to-Intermex integration.

The fulfillment lifecycle separates internal readiness from external truth:
`WAITING_PAYMENT -> READY_FOR_INTERMEX_HANDOFF -> INTERMEX_HANDOFF_PENDING ->
INTERMEX_HANDOFF_CONFIRMED -> ACCEPTED_BY_INTERMEX -> READY_TO_PICK -> PICKING -> PACKED ->
HANDED_TO_CARRIER -> IN_TRANSIT -> DELIVERED`. Every externally asserted milestone requires
attributable evidence. Picking and packing cannot begin before Intermex confirmation/acceptance.

Payments are evidence records, not a processor. Bank transfer settlement requires verified
settlement evidence. COD collection is not remittance: only `COD_REMITTED_CONFIRMED` can settle an
order. Partial collection/remittance and discrepancies remain unpaid.

Shipping rates are keyed by destination Emirate. Unknown destinations remain unknown unless an
explicit, labeled fallback is enabled; COD compatibility is separate. Inventory uses validated
statuses and becomes `STALE` after `CORNEROPS_COMMERCIAL_INVENTORY_EVIDENCE_STALE_AFTER_HOURS`
(default 24). Missing evidence is unknown or confirmation-required, never available.

Confirmed orders materialize one stable fulfillment record and one independently scoped Work Queue item. Quote review
and sensitive exceptions use the existing Approval Engine. Delivery failures create a stable
exception. Daily Close cannot close over an unacknowledged critical exception.

## Production boundary

`CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED=false` and
`CORNEROPS_COMMERCIAL_DEMO_ENABLED=false` by default. The demo is classified
`COMMERCIAL_DEMO_DATA_NOT_PRODUCTION`; production has no mock fallback. No external-send,
payment-capture, shipment-creation, CornerMex-write, supplier-contact or customer-contact route is
defined.
