# Commercial Operations Core v1.17A

## Operating loop

`Account -> Opportunity -> Quote -> Founder approval -> Order -> Payment -> Fulfillment -> Shipment -> Delivery -> Exception -> Daily close`

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

Payments are evidence records, not a processor. CornerOps stores no card data and performs no
capture or refund. A confirmed payment requires evidence and a human actor. COD and bank transfer
are tracked as methods and exposure.

Confirmed orders materialize one stable fulfillment record and one Work Queue item. Quote review
and sensitive exceptions use the existing Approval Engine. Delivery failures create a stable
exception. Daily Close cannot close over an unacknowledged critical exception.

## Production boundary

`CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED=false` and
`CORNEROPS_COMMERCIAL_DEMO_ENABLED=false` by default. The demo is classified
`COMMERCIAL_DEMO_DATA_NOT_PRODUCTION`; production has no mock fallback. No external-send,
payment-capture, shipment-creation, CornerMex-write, supplier-contact or customer-contact route is
defined.
