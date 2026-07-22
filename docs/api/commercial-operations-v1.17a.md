# Commercial Operations API v1.17A

All routes require the existing Control Tower operator token. Every `POST` additionally requires
Founder Action authentication, exact-origin checks, JSON content type and rate limiting.

## Reads

- `GET /api/intelligence/commercial/status`
- `GET /api/intelligence/commercial/founder-daily`
- `GET /api/intelligence/commercial/{accounts|skus|opportunities|quotes|orders|payments|fulfillments|exceptions|daily-closes}`

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

The input preview performs no write. Confirmation requires a valid versioned JSON/CSV pack,
explicit confirmation and a stable SHA-256 checksum. Coverage starts at one account and one SKU;
10 priority accounts and 18 launch SKUs remain targets, never fabricated minimums.
