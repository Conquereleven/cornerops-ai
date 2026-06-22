# Internal Beta Readiness v0.3

- [x] Repository builds and typechecks.
- [x] Backend and frontend tests pass.
- [x] Existing demos and `demo:beta` pass without credentials.
- [x] No secrets are committed; `.env` remains ignored.
- [x] `.env.example` contains v0.3 feature and security flags.
- [x] GitHub read-only onboarding and fallback are implemented.
- [x] GitHub writes are blocked by default.
- [x] OpenClaw and ecosystem services are optional.
- [x] Context layer runs safely in mock mode.
- [x] Audit logs, approvals, PII masking and fail-closed tests work.
- [x] Core agents are validated against mock/read-only sources.
- [x] Control Tower CLI and internal API work.
- [x] Rollback/shutdown procedures are documented.
- [x] Known risks are documented in the QA audit.

## Beta limits

Approvals and specialized audit logs are in memory, internal auth is not RBAC,
the router is keyword-based and local SQLite archives are not production-ready.

## Next sprint

Persist approvals/audits in Supabase with versioned migrations, introduce RBAC,
add grounded-agent evaluations and collect beta reliability metrics before any
new channel or write-capable integration.
