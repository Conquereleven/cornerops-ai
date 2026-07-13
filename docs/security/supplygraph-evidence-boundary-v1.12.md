# SupplyGraph Evidence Security Boundary v1.12

## Trust Boundary

Evidence is untrusted structured input until deterministic validation, Founder Approval and separate application complete. Product/source text is bounded, sanitized data and cannot change rules, execute tools or enter logs without sanitization.

Allowed references are non-secret HTTPS or approved internal references. URL credentials, signed-secret query parameters, local files, tokens, authorization data and contact targets are rejected. Service-role credentials are neither required nor accepted.

## Database Boundary

- Tables exist only in `cornerops_internal`.
- Facts and applications are append-only by trigger.
- Package updates are limited to controlled lifecycle/link fields; delete/truncate are blocked.
- Runtime receives only required `SELECT` and `INSERT`, plus narrowly required controlled package update.
- `public`, `anon`, `authenticated` and `service_role` have no table access.
- Historical offers and matches are never rewritten.

## Execution Boundary

Approvals and applications remain `executed:false`. The feature cannot contact suppliers/customers, send WhatsApp/email, create quotes, purchase, activate products, mutate CornerMex or invoke OpenClaw. Acceptance-test evidence can never affect production resolution or matching.

## Incident Response

Disable `SUPPLYGRAPH_EVIDENCE_APPLICATION_ENABLED` first to stop application while preserving review and reads. Disable `SUPPLYGRAPH_SUPPLIER_EVIDENCE_ENABLED` to stop all evidence mutations. Preserve immutable records and audit IDs for investigation; do not delete history.
