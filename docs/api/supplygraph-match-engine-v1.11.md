# SupplyGraph Match API v1.11

All routes require the Control Tower operator bearer token. Mutation additionally requires the Founder
Action token, exact allowed origin, JSON content type and the existing rate limit.

## Create or reuse a match

`POST /api/intelligence/supplygraph/demand-requests/:id/match`

```json
{"version": 1, "maxCandidatesPerItem": 5}
```

Only these fields are accepted. Candidate count is `1–10`; scoring overrides are forbidden. New runs
return 201 and identical fingerprints return 200. A stale demand version returns 409; disabled matching
returns 503 without writes.

## Reads

- `GET /api/intelligence/supplygraph/match-runs`
- `GET /api/intelligence/supplygraph/match-runs/:id`
- `GET /api/intelligence/supplygraph/demand-requests/:id/match-runs`
- `GET /api/intelligence/supplygraph/demand-requests/:id/latest-match`

List filters include demand, coverage, readiness, recommendation, date, limit and offset/cursor. Limits
are capped at 100. Responses expose sanitized evidence, never notes, contact PII, SQL or credentials.

Every result states single-supplier scope, no market comparison, no best-supplier claim, no CornerMex
mutation, blocked activation and blocked external actions.
