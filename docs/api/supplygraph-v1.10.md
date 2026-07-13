# SupplyGraph API v1.10

Base: `/api/intelligence/supplygraph`. All endpoints use the existing Control Tower operator token.
Mutation endpoints additionally require the Founder Action Token, JSON content type, exact CORS origin
and the existing founder-action rate limit. Responses never include credentials or raw contact PII.

## Reads

- `GET /status`: persistence, data-quality counts, freshness and blocked capabilities.
- `GET /suppliers`: filters `status`, `supplierType`, `countryCode`, `verificationStatus`, `limit`.
- `GET /suppliers/:id`: one supplier.
- `GET /catalog`: filters `supplierId`, `category`, `brand`, `verificationStatus`, `stockStatus`,
  `observedBefore`, `observedAfter`, `limit`, `cursor`/`offset`.
- `GET /demand-requests`: filters `status`, `priority`, `emirate`, `customerSegment`, `sourceType`,
  `limit`, `cursor`/`offset`.
- `GET /demand-requests/:id`: one request and its items.

Limits are bounded to 100.

## Mutations

- `POST /intermex/sync`: checksum-verifies and synchronizes the reviewed local snapshot. No network,
  CornerMex mutation, activation or external action occurs.
- `POST /demand-requests`: accepts opaque `customerReference`, segment, emirate, priority, optional
  required date/currency/source reference/notes, and 1-50 structured items.
- `PATCH /demand-requests/:id`: requires `version` and one command:
  `set_priority`, `set_required_by`, `set_status`, `add_item`, `update_item`, `deactivate_item`,
  `mark_ready_for_matching`, `close_request`.

Item deactivation and request closure require reasons. No DELETE API exists. Stale versions return 409.
`mark_ready_for_matching` returns 409 while critical fields remain missing. Idempotent demand creation
returns the existing request. Every accepted mutation appends audit evidence.

## Data exclusions

No customer name, contact person, email, telephone, WhatsApp, physical address or raw message body is
accepted as a first-class field. `customerReference` must be an opaque identifier. Notes are bounded and
sanitized. No supplier recommendation or matching score is returned.
