# First Real Source: GitHub Read-Only

## Least-privilege token

Use a fine-grained token scoped only to `Conquereleven/cornerops-ai`. Grant
read-only access to metadata, issues, pull requests and actions. Do not grant
administration, contents write, workflows write or secrets access.

## Enable

```env
CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED=true
CORNEROPS_FIRST_REAL_SOURCE=github
CORNEROPS_FIRST_REAL_SOURCE_MODE=read_only
GITHUB_ENABLED=true
GITHUB_READ_ONLY=true
GITHUB_DRY_RUN=true
GITHUB_ALLOW_ISSUE_CREATION=false
GITHUB_ALLOW_PR_WRITE=false
GITHUB_ALLOW_WORKFLOW_TRIGGER=false
GITHUB_OWNER=Conquereleven
GITHUB_REPO=cornerops-ai
GITHUB_TOKEN=<server-only token>
```

Restart the backend and run `npm run control:tower`. `github.connected` must be
true and `github.mode` must be `read_only`. Read issues/PRs/workflows through the
existing API or agent demo and inspect `/api/control-tower/audit-summary`.

## Prove writes are blocked

Keep every `GITHUB_ALLOW_*` false. `POST /api/github/issues` must return a
`denied` result while read-only is true. Merge and workflow-trigger methods also
return denied without network calls.

## Disable

Set `GITHUB_ENABLED=false` and
`CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED=false`, remove the token and restart.
CornerOps returns to fixture data without breaking agents.

## Troubleshooting

- 401: token missing, expired or invalid.
- 403: repository permission denied; if remaining rate limit is zero, wait for reset.
- 404: token cannot see the repository or owner/repo is incorrect.
- Rate limit: Control Tower stays available; retry after the reported reset.
- Missing credentials: expected degraded/mock status, not a process crash.
