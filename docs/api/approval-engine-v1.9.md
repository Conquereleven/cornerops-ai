# Approval Engine API v1.9

## Endpoints

- `GET /api/intelligence/approvals`
- `GET /api/intelligence/approvals/:id`
- `POST /api/intelligence/approvals/:id/approve`
- `POST /api/intelligence/approvals/:id/reject`
- `POST /api/intelligence/approvals/:id/cancel`

Decision routes require operator read authentication plus the separate founder-action credential.
The JSON body must contain a non-empty `reason`.

An approval records only an internal founder decision. It never executes a send or production
mutation in v1.9:

```json
{
  "approved": true,
  "executed": false,
  "executionStatus": "not_available_in_current_version",
  "productionMutationsBlocked": true,
  "externalSendsBlocked": true
}
```

Pending approvals are unique per work item. A second or conflicting decision returns HTTP 409. Each
request and decision appends an immutable audit event with a sanitized correlation ID and metadata.
