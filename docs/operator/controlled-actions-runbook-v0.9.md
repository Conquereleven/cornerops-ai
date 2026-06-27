# Controlled Actions Operator Runbook v0.9

## Safe activation

Keep `.env` private. For local dry-run:

```env
CORNEROPS_CONTROLLED_ACTIONS_ENABLED=true
CORNEROPS_CONTROLLED_ACTIONS_DRY_RUN=true
CORNEROPS_CONTROLLED_ACTIONS_REQUIRE_APPROVAL=true
CORNEROPS_CONTROLLED_ACTIONS_FAIL_CLOSED=true
CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_ENABLED=true
CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_DRY_RUN=true
CORNEROPS_ACTION_INTERNAL_NOTE_CREATE_ENABLED=true
CORNEROPS_ACTION_INTERNAL_NOTE_CREATE_DRY_RUN=true
CORNEROPS_ACTION_INTERNAL_TASK_CREATE_ENABLED=true
CORNEROPS_ACTION_INTERNAL_TASK_CREATE_DRY_RUN=true
CORNEROPS_ALLOW_LOCAL_INTERNAL_WRITES=false
GITHUB_ALLOW_ISSUE_CREATION=false
GITHUB_READ_ONLY=true
GITHUB_DRY_RUN=true
```

Restart after changing flags. Confirm Control Tower reports `dryRun=true`, real execution blocked and idempotency healthy.

## Founder workflow

```bash
npm run cornerops -- actions
npm run cornerops -- ask "Create a GitHub issue draft for manual payment audit IDs"
npm run cornerops -- approvals
npm run cornerops -- approvals approve <approval-id>
npm run cornerops -- approvals execute-dry-run <approval-id>
```

The structured API flow is:

```bash
curl -X POST http://127.0.0.1:3000/api/actions/github/issues/draft \
  -H "x-cornerops-console-token: $CORNEROPS_WEB_CONSOLE_AUTH_TOKEN" \
  -H "x-operator-id: founder" -H "content-type: application/json" \
  -d '{"title":"Bug title","body":"Sanitized internal description"}'
```

Use the corresponding `request-approval` endpoint, approve in Approval Center, then use `execute-dry-run`. Internal note/task endpoints follow the same pattern.

## Inspect

- Control Tower: `/control-tower`
- API state: `GET /api/actions`
- Pending approvals: Approval Center or `npm run cornerops -- approvals`
- Lifecycle: Audit Viewer filter `actions`
- Demos: `npm run demo:v0.9`

## Real GitHub issue creation later

Do not enable during ordinary beta use. First use a fine-grained repository token with Issues write only, verify owner/repo, allowlisted labels and rollback ownership. Then set every required global/action/GitHub flag, keep approval mandatory and execute one supervised low-risk issue. Never enable PR writes or workflow triggers.

## Recovery

On corruption, checksum mismatch, duplicate warning or unhealthy idempotency, stop execution and preserve `.cornerops/state`. Do not switch to a permissive provider for a real external action. Disable controlled actions and follow the v0.8.1 rollback procedure.
