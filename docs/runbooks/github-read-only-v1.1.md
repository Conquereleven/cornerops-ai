# GitHub Read-Only Runbook v1.1

## Required Permissions

Use a fine-grained token scoped to the target repo with read-only access to:

- Metadata
- Issues
- Pull requests
- Actions/workflow runs

Do not grant write permissions.

## Env

```env
GITHUB_ENABLED=true
GITHUB_READ_ONLY=true
GITHUB_DRY_RUN=true
GITHUB_TOKEN=<private-read-only-token>
GITHUB_OWNER=Conquereleven
GITHUB_REPO=cornerops-ai
GITHUB_ALLOW_ISSUE_CREATION=false
GITHUB_ALLOW_PR_WRITE=false
GITHUB_ALLOW_WORKFLOW_TRIGGER=false
CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED=true
CORNEROPS_GITHUB_AUDIT_READS=true
```

## Test

```bash
npm run github:read-only-check
npm run demo:github-read-only
```

## Verify No Writes

Confirm all write flags are false in Control Tower v1.1 and script output. The script never creates issues, comments, labels, merges PRs or triggers workflows.

## Disable

```bash
GITHUB_ENABLED=false
CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED=false
```
