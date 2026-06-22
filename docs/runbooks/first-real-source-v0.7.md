# First Real Source Runbook v0.7

`CORNEROPS_FIRST_REAL_SOURCE=auto` evaluates `CORNEROPS_PREFERRED_REAL_SOURCE_ORDER`, defaulting to `business_db,github`. A source is selected only when credentials exist, the adapter is connected and read-only is verified. Otherwise CornerOps uses labeled mock data.

## Business DB via Supabase

```env
CORNEROPS_FIRST_REAL_SOURCE_ENABLED=true
CORNEROPS_FIRST_REAL_SOURCE=business_db
CORNEROPS_FIRST_REAL_SOURCE_MODE=read_only
CORNEROPS_BUSINESS_DATA_ENABLED=true
CORNEROPS_BUSINESS_DATA_MODE=read_only
CORNEROPS_DATABASE_PROVIDER=supabase
SUPABASE_URL=<project-url>
SUPABASE_READONLY_KEY=<dedicated-read-only-key>
CORNEROPS_DB_READ_ONLY=true
CORNEROPS_DB_ALLOW_WRITES=false
```

Use a database role restricted to SELECT. Schema discovery, row limits, PII masking and read audits remain active. Postgres URL mode is not ready until a driver-backed adapter exists.

## GitHub

```env
CORNEROPS_FIRST_REAL_SOURCE_ENABLED=true
CORNEROPS_FIRST_REAL_SOURCE=github
CORNEROPS_FIRST_REAL_SOURCE_MODE=read_only
GITHUB_ENABLED=true
GITHUB_TOKEN=<fine-grained-read-only-token>
GITHUB_OWNER=Conquereleven
GITHUB_REPO=cornerops-ai
GITHUB_READ_ONLY=true
GITHUB_DRY_RUN=true
GITHUB_ALLOW_ISSUE_CREATION=false
GITHUB_ALLOW_PR_WRITE=false
GITHUB_ALLOW_WORKFLOW_TRIGGER=false
```

Only issue, PR, workflow-run and repository reads are available. Create/update/comment/merge/workflow mutations remain denied.

## Verify and rollback

```bash
npm run demo:first-real-source
npm run demo:v0.7
npm run control:tower
```

Confirm `selectedSource`, `mode`, credentials and `readOnlyVerified`. To rollback, disable first-source and integration flags, then restart; mock data remains available.
