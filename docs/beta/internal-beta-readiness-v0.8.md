# Internal Beta Readiness v0.8

- [x] Unified v0.8 report covers safety, channels, sources, agents, approvals and audit.
- [x] Existing React/Vite frontend provides `/control-tower`.
- [x] API is disabled by default, local-only and token protected when enabled.
- [x] Approval Center is dry-run only and audited.
- [x] Audit previews are truncated, PII-masked and private-content redacted.
- [x] Security Dashboard reports writes/sends/customer channels/native tools/ClawHub blocks.
- [x] Operator Ask routes through existing CornerOps policy and audit.
- [x] Static local HTML fallback exists.
- [x] Demos require no real credentials.
- [ ] Founder local token provisioned outside Git.
- [ ] Supervised local browser acceptance completed on the founder machine.
- [ ] Durable multi-user auth/SSO before any non-local deployment.
- [ ] Shared audit/approval store before multi-process operation.

Release posture: ready for authenticated localhost beta; not approved for public or production-network exposure.
