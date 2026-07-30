# Commercial Operations API v1.17A

All routes require the existing Control Tower operator token. Every `POST` additionally requires
Founder Action authentication, exact-origin checks, JSON content type and rate limiting.

## Reads

- `GET /api/intelligence/commercial/status`
- `GET /api/intelligence/commercial/founder-daily`
- `GET /api/intelligence/commercial/{accounts|skus|opportunities|quotes|orders|payments|fulfillments|exceptions|daily-closes}`

Authentication is evaluated before feature availability. With Commercial Operations disabled,
the authenticated status route returns HTTP 200 with `status=disabled`,
`code=COMMERCIAL_OPERATIONS_DISABLED`, `featureEnabled=false` and `querySkipped=true`. The ten
data routes return HTTP 503 with the same code and `status=unavailable`; they never return an empty
collection that could be mistaken for a successful persistence read.

When the feature is enabled but one or more required private persistence relations are unavailable,
the status route performs only a read-only readiness probe and returns
`status=configuration_required`. Data routes return HTTP 503 with
`code=COMMERCIAL_PERSISTENCE_REQUIRED`. Public responses omit relation names, schema names, SQL,
SQLSTATE and connection details. PostgreSQL undefined-table errors are translated at the commercial
persistence boundary as defense in depth.

## Internal mutations

- `POST /api/intelligence/commercial/input-packs/{preview|confirm}`
- `POST /api/intelligence/commercial/opportunities`
- `POST /api/intelligence/commercial/quotes`
- `POST /api/intelligence/commercial/quotes/:id/{transition|export|accept}`
- `POST /api/intelligence/commercial/orders/:id/{transition|payments|fulfillment}`
- `POST /api/intelligence/commercial/fulfillments/:id/transition`
- `POST /api/intelligence/commercial/exceptions/:id/transition`
- `POST /api/intelligence/commercial/daily-close`

These routes write only to the private CornerOps internal database after a separately approved
migration and feature-flag activation. They cannot send messages, capture/refund payments, create
shipments, contact customers/suppliers or write to CornerMex.

The input preview performs no write and remains available to an authenticated Founder Action caller
while the commercial feature is disabled so an input pack can be validated safely. Confirmation is
blocked while disabled or while persistence is unavailable. Once separately activated and ready,
confirmation requires a valid versioned JSON/CSV pack,
explicit confirmation and a stable SHA-256 checksum. Coverage starts at one account and one SKU;
10 priority accounts and 18 launch SKUs remain targets, never fabricated minimums.

## Truth and evidence contract

- Work Queue scope is stable by entity family, stable entity ID and condition kind; evidence
  checksum and timestamps never define identity.
- Fulfillment exposes `commercialOwner`, `warehouseCustodian` and `carrierProvider`, plus separate
  CornerMex, Intermex, handoff, carrier and evidence references. Unknown references remain `unknown`.
- External fulfillment transitions require source type/reference, actor, recorded/evidence
  timestamps, checksum, previous/new state, order ID, verification status and optional Intermex or
  carrier references. Raw evidence payloads are not returned.
- Bank Transfer uses pending verification, settlement confirmed, rejected or discrepancy states.
- COD uses pending collection, collected pending remittance, remittance pending verification,
  remitted confirmed, discrepancy and failure states. Only remitted-confirmed settles the order.
- Shipping configuration is destination-aware through `CORNEROPS_COMMERCIAL_SHIPPING_RATES_AED`;
  fallback and COD compatibility require separate opt-in flags.
- Inventory evidence uses a fixed status enum and a configurable freshness threshold. Stale
  evidence cannot establish availability.
