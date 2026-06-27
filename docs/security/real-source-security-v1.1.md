# Real Source Security v1.1

v1.1 uses a read-only model. Real sources are inputs only; CornerOps remains the decision and audit layer.

## GitHub

- Use fine-grained read-only tokens.
- Keep `GITHUB_READ_ONLY=true`.
- Keep `GITHUB_DRY_RUN=true`.
- Keep `GITHUB_ALLOW_ISSUE_CREATION=false`.
- Keep `GITHUB_ALLOW_PR_WRITE=false`.
- Keep `GITHUB_ALLOW_WORKFLOW_TRIGGER=false`.
- Never log or commit tokens.

## Business DB / Supabase

- Use only read-only credentials.
- Keep `CORNEROPS_DB_READ_ONLY=true`.
- Keep `CORNEROPS_DB_ALLOW_WRITES=false`.
- Keep `CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED=false` unless explicitly inspecting schema.
- Enforce `CORNEROPS_DB_MAX_ROWS`.
- Keep `CORNEROPS_DB_PII_MASKING=true`.

## Audit

Real source reads are audited when enabled. Scripts report token presence as a boolean only and never print token material.

## Rollback

Set these flags to return to mock-only:

```bash
GITHUB_ENABLED=false
CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED=false
CORNEROPS_BUSINESS_DATA_ENABLED=false
CORNEROPS_FIRST_REAL_SOURCE_ENABLED=false
```
