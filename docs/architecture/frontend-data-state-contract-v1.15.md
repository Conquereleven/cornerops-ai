# Frontend Data-State Contract v1.15

Every module derives: `status`, `source`, `lastUpdatedAt`, `freshness`, `readOnly`, `writesBlocked`, `externalActionsBlocked`, `reasonCode`, `retryable` and optional `affectedSections`.

Allowed statuses: `live`, `live_read_only`, `partial`, `empty`, `configuration_required`, `disabled`, `unavailable`, `stale`, `error`.

Allowed sources: `internal_postgresql`, `cornerops_api`, `cornermex_read_only`, `supplygraph`, `internal_audit`, `internal_work_queue`, `internal_approval_engine`, `configuration`, `unavailable`.

Rules:

1. A failed query displays `unavailable` or `error`, never zero.
2. Partial requests identify affected sections.
3. Empty means a successful read returned no records.
4. Configuration problems do not use loading skeletons indefinitely.
5. Safe reads may be retried manually; mutations are never automatically retried.
6. No frontend adapter substitutes fixtures or sample operational records.
