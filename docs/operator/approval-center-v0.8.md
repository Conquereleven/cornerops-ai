# Approval Center v0.8

Approval Center shows approval ID, status, requested action/agent, risk, touched field names, source mode, creation time and policy reason.

States are `pending`, `approved` and `rejected`. Risk is `low`, `medium` or `high`; payment, write, send, deploy, merge, delete and status actions are high risk.

`Approve dry-run` and `Reject` update only the in-memory approval status. They do not call tools, write business data or send externally. Every decision creates a sanitized audit event and returns its `auditId`.

Real execution remains disabled through:

```env
CORNEROPS_APPROVAL_CENTER_ENABLED=true
CORNEROPS_APPROVAL_CENTER_DRY_RUN=true
CORNEROPS_APPROVAL_CENTER_ALLOW_REAL_EXECUTION=false
```

If dry-run is disabled or real execution is enabled, v0.8 fails closed instead of resolving approvals.

## v0.9 controlled approvals

Controlled approvals add `executionStatus`, requested dry-run mode, risk, immutable sanitized payload and checksum. The lifecycle continues from `approved` to `executing` and one of `dry_run_executed`, `executed` or `execution_failed`.

Only approvals created by the controlled-action executor contain the payload/checksum required for the `Execute dry-run` button. Agent proposal approvals without a structured payload remain non-executable. Repeated execution is blocked and audited.

## v1.0 founder usage

For founder beta, Approval Center remains a review and dry-run execution surface.
Use it to approve or reject controlled-action proposals, then execute only
`dry-run` approvals. Real execution remains disabled unless a future supervised
pilot explicitly enables all required flags.
