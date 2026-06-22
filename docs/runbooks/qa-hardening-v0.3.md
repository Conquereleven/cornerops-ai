# QA Hardening Runbook v0.3

Run `npm ci`, `npm --prefix frontend ci`, then `npm run qa`. A syntax failure
usually identifies a file directly; typecheck failures are frontend contract
drift; Jest/Vitest failures must be fixed before build is considered meaningful.

Run `npm run demo:all`, `npm run control:tower` and `npm run demo:beta` without
credentials. Control Tower may be `degraded` in mock mode; `unhealthy` means a
critical security guard is disabled.

Verify security with `GET /api/control-tower/security`. Required true fields are
`strictMode`, `piiMasking`, `logSanitization`, `failClosed`,
`requireAuditForTools`, `requireApprovalForWrites` and
`requireApprovalForExternalActions`.

Dry run is verified when `dryRun=true` in Control Tower and write-style demos
return `dry_run`, `denied` or `needs_approval`. Approval gates are verified via
the pending approvals endpoint; unknown statuses must never authorize work.
