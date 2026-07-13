# Unified Command Center API v1.15

The UI reuses the authenticated read-only frontend contract at `/api/control-tower/frontend/v1` and its `status`, `founder-daily`, `cornermex`, `flows`, `work-queue`, `drafts`, `approvals`, `audit`, `security`, `telegram` and `actions` sections.

SupplyGraph pages retain their existing authenticated read APIs. CornerMex operations retain current read repositories. No new mutation endpoint is introduced.

Every frontend envelope preserves source mode, read-only status, write/external-send blocks, approval requirement, warnings and audit ID. Failed source construction reports unavailable and does not emit substitute records.
