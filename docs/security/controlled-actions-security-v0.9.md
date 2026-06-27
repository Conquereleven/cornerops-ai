# Controlled Actions Security v0.9

## Threat model

Primary threats are forged approvals, payload substitution, replay/duplicate execution, secrets in issue content, accidental business-data mutation, compromised channels, unavailable audit/idempotency storage and over-broad GitHub credentials.

## Controls

- Registry allowlists exactly three action ids; unknown ids deny.
- Policy requires enabled flags, known agent/channel, operator identity, audit, fail-closed mode and DataAccessPolicy approval.
- Payload validation limits sizes, masks PII and rejects detected tokens/JWTs/authorization values.
- Approved payloads use a canonical SHA-256 checksum verified immediately before execution.
- Approval transitions are constrained and audited through the existing persistent services.
- Idempotency is reserved before execution; terminal approvals are replay-safe.
- GitHub checks all flags again inside the integration service.
- Local note/task repositories are isolated from lead/order/quote/business DB repositories.

## External side effects

Only `github.issue.create` has an external side effect. Default configuration blocks it. Safe future enablement needs a fine-grained token limited to issues on one repository, explicit approval, dry-run rehearsal and verified audit/idempotency health.

Rollback is manual deletion/closure of the created issue using GitHub controls; CornerOps records the external id/URL. CornerOps does not automatically delete external resources in v0.9.

## Fail-closed conditions

Execution denies on missing action, disabled action, missing operator, unavailable audit, missing/corrupt approval payload, checksum mismatch, invalid transition, unavailable idempotency, disallowed agent/channel, production-data impact or incomplete real-execution flags.

## Permanently blocked in v0.9

Payments, paid/order/lead/quote state changes, business DB writes, WhatsApp/Slack/customer sends, external email, crawler sync, deploys, workflow triggers, PR merges, branch/code writes, native host tools and ClawHub execution.
