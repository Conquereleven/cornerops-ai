# Intelligence Live Control Tower API v1.8

All endpoints use the existing Control Tower frontend auth middleware under `/api/intelligence`.

## GET `/api/intelligence/control-tower-status`

Unified live status object for Lovable Control Tower:

- `mode`: expected `real_read_only` when Supabase read-only is configured
- `fallbackActive`: `false` when live data is available
- `catalog`: cohort counts for total products, draft imported products, active existing products, stock, duplicate SKUs, and field availability
- `founderReview`: pre-launch review status, score, risks, next actions
- `capabilityMatrix`: mature operational states, not scary failure labels
- `actionEngine`: safe recommended internal actions
- `productActivation`: recommendation-only activation plan
- `environmentDoctor`: configured/missing checks without secret values

## GET `/api/intelligence/action-engine`

Returns safe internal workflow recommendations. It never sends externally and never mutates production data.

## POST `/api/intelligence/action-engine/drafts`

Returns internal draft objects from current recommended actions.

- `sendStatus`: `not_sendable_in_current_version`
- `persistence`: `not_configured` unless a safe internal store exists
- no WhatsApp send
- no email send
- no customer-channel action
- no Supabase write

## GET `/api/intelligence/product-activation`

Returns recommendation-only launch batches for imported draft products. Product activation remains blocked.

## GET `/api/intelligence/environment-doctor`

Reports configuration presence only. It must never return token, key, password, connection string, or service-role values.
