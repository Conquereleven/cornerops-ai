# Work Queue API v1.9

Base path: `/api/intelligence`. CornerOps business inputs remain read-only; these routes write only
to `cornerops_internal`.

## Reads

- `GET /work-queue/status`
- `GET /work-queue`
- `GET /work-queue/:id`
- `GET /work-queue/drafts`
- `GET /work-queue/audit`

`GET /work-queue` accepts `status`, `priority`, `sourceFlow`, `actionType`, `approvalRequired`,
`operatingStage`, `owner`, and `limit`. Reads require the Control Tower operator Bearer token.

## Controlled internal writes

- `POST /work-queue/sync`
- `PATCH /work-queue/:id`

Writes require both the operator Bearer token and `X-CornerOps-Founder-Action-Token`. Sync returns:

```json
{
  "scannedRecommendations": 8,
  "createdWorkItems": 3,
  "reusedWorkItems": 5,
  "reopenedWorkItems": 0,
  "skippedRecommendations": 0,
  "errors": []
}
```

Allowed PATCH commands are `set_priority`, `assign_owner`, `set_due_date`, `set_status`,
`mark_manually_completed`, and `dismiss`. Every command requires the current `version`; stale writes
return HTTP 409. Dismissal and manual completion carry a human reason.

Sync creates or reuses deterministic internal work items. It does not activate products, change
orders/payments/customers, send messages, publish campaigns, or call external execution adapters.

## Persistence behavior

Production uses PostgreSQL only when `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED=true` and a restricted
`CORNEROPS_INTERNAL_DATABASE_URL` is configured. Otherwise reads report `configuration_required`
and writes fail closed with HTTP 503. There is no production fallback to files or memory.
