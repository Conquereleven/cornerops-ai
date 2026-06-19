# Architecture Consolidation v0.3

## Canonical boundaries

- `core/domain/audit`: canonical business/data access audit repository.
- `core/audit/AgentAuditService`: agent routing and decision audit.
- `integrations/openclaw/AuditLogService`: gateway compatibility facade.
- `core/security/SecuritySanitizer`: canonical redaction, PII masking and limits.
- `core/policies/ToolExecutionPolicy`: agent proposed-action contract.
- `integrations/openclaw/ToolExecutionPolicy`: OpenClaw action-type contract.
- `core/domain/approvals/ApprovalService`: domain facade.
- `integrations/openclaw/HumanApprovalService`: current in-memory approval store.

The duplicate names are boundary adapters, not interchangeable implementations.
Deleting them would break public contracts. v0.3 therefore reuses the canonical
sanitizer, retains compatibility exports and documents ownership.

## Registries

Agent, data, context, crawler, native-tool, local-archive and ecosystem
registries now reject duplicate IDs. This prevents silent configuration
replacement while preserving existing list/get APIs.

## Deferred consolidation

Persisting approvals and all audit scopes behind common repository interfaces is
deferred until a versioned migration exists. It must not be done as an in-place
rewrite during beta hardening.
