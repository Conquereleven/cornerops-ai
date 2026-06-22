# Security Hardening v0.3

CornerOps uses fail-closed decisions: unknown agents, sources, modes, actions,
tool risks and approval states are denied. An approval-required result is a
proposal, never execution.

`SecuritySanitizer` is the canonical privacy boundary. It redacts credentials,
authorization/cookies and secrets; masks email/phone values; removes raw message,
thread and transcript content from audit payloads; and caps payload size.

Writes and external actions require approval. GitHub is read-only, OpenClaw is
optional/dry-run, ecosystem services are feature-flagged, crawlers cannot sync,
and native host-control operations are denied by default. Local archives remain
disabled until consent, retention and access-boundary reviews are complete.

The internal API key is an initial control, not full RBAC. Persisted approvals,
tamper-evident audit storage and role separation remain beta exit requirements.
