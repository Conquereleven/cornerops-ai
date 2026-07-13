# SupplyGraph Supplier Evidence API v1.12

Base path: `/api/intelligence/supplygraph`

All reads require operator authentication. Mutations additionally require existing Founder Action authentication, exact allowed origin, JSON content type and existing rate limiting.

## Mutation Endpoints

- `POST /evidence-packages`
- `POST /evidence-packages/:id/apply`
- `POST /evidence-packages/:id/cancel`

Creation accepts a bounded package and up to `SUPPLYGRAPH_EVIDENCE_MAX_FACTS_PER_PACKAGE` facts. Apply accepts only `version` and `previewFingerprint`. Cancel requires `version` and a reason. Trust ordering and validation rules cannot be supplied by callers.

## Read Endpoints

- `GET /evidence-packages`
- `GET /evidence-packages/:id`
- `GET /evidence-packages/:id/preview`
- `GET /catalog/:id/evidence`
- `GET /suppliers/:id/evidence-status`
- `GET /evidence-conflicts`
- `GET /evidence-expiring`

List limits are bounded to 100. Acceptance-test observations are excluded unless the internal endpoint option explicitly allows them. Responses omit raw credentials, SQL, PII and unbounded evidence.

## Safety Responses

- Evidence disabled: mutation returns `503` with no write.
- Application disabled: apply returns `503` with no resolved evidence change.
- Stale version or preview: `409`.
- Missing Approval: `409`.
- Conflict or repeated application: `409`.

Historical SupplyGraph reads and match runs remain available when evidence mutation is disabled.
