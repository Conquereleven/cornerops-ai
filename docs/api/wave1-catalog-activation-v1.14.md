# Wave 1 Catalog Activation API v1.14

All routes require existing operator authentication. Mutations additionally require Founder Action authentication, exact origin, JSON and rate limiting.

## Reads

- `GET /api/intelligence/supplygraph/wave1-activation`
- `GET /api/intelligence/supplygraph/sellers/:id/catalog-health`
- `GET /api/intelligence/supplygraph/catalog/capture-summary`
- `GET /api/intelligence/supplygraph/media/coverage`
- `GET /api/intelligence/supplygraph/inventory/initialization-status`

Responses expose actual seller, product, public-price, media and operational-inventory counts; capture states; blockers; source states; physical-verification boundaries; and safety claims.

## Work Queue Mutation

- `POST /api/intelligence/supplygraph/wave1-activation/work-queue/sync`

This synchronizes deterministic internal tasks only. It performs no external action.

## Existing Package Workflow

Catalog extensions reuse:

- `POST /api/intelligence/supplygraph/seller-onboarding-packages/from-snapshot`
- package preview/read endpoints
- Approval endpoints
- `POST /api/intelligence/supplygraph/seller-onboarding-packages/:id/apply`

The Wave 1 application kill switch blocks v1.14 package application while preserving previews and historical reads.

## Excluded Data

No raw HTML, credentials, filesystem paths, SQL, private contracts, contact details or unbounded source content is returned.
