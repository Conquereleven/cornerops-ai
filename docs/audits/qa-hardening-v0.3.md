# QA and Hardening Audit v0.3

## Implementation summary

CornerOps AI contains an Express backend, React/Vite operator UI, six core
agents, deterministic routing, business-data and context layers, OpenClaw
gateway adapters, ecosystem capability stubs, Supabase-ready persistence,
approvals and three audit scopes. The v0.3 baseline passed install-compatible
syntax, backend tests, frontend tests, typecheck, build and every existing demo.

## Modules found

- AgentRegistry, AgentOrchestrator, prompts, tools and six v0.1 agents.
- DataSourceRegistry, DataAccessPolicy and DataHealthService.
- ContextSourceRegistry, ContextAccessPolicy and ContextHealthService.
- Local mock/SQLite archive adapters, crawler adapters and native-tool policy.
- OpenClaw gateway, ecosystem registry and SDK bridge registry.
- GitHub client/services/webhook handler.
- Domain/OpenClaw/agent audit services and HumanApprovalService facade.

## Missing or intentionally stubbed modules

- SQLite archive persistence remains an explicit stub.
- OpenClaw real contract and channel delivery remain disabled.
- Approvals and agent/OpenClaw audit stores remain process memory.
- Real connectors other than GitHub read-only are intentionally absent.
- Fine-grained RBAC is not implemented; internal API uses a server-side key.

## Duplicate abstractions

Audit and policy names overlap, but their contracts differ by boundary. They are
not interchangeable duplicates. v0.3 makes `SecuritySanitizer` canonical and
keeps compatibility exports. See `docs/architecture/consolidation-v0.3.md`.

## Broken or risky areas found

- P0 fixed: unknown OpenClaw/core actions were approvable instead of denied.
- P0 fixed: generic logger did not sanitize metadata.
- P0 fixed: approval payloads could retain raw message content.
- P1 fixed: GitHub had no explicit read-only/write-feature gates.
- P1 fixed: the previous Control Tower script was an agent demo, not status.
- P1 fixed: registries silently replaced duplicate IDs.
- P2 open: approvals and specialized audits are not durable.
- P2 open: router uses deterministic keywords rather than evaluated routing.

## Security, privacy, approvals and audit

Fail-closed checks now deny unknown agent/action/source/mode/risk/approval state.
The shared sanitizer redacts credentials/cookies, masks emails/phones, removes
raw private content and truncates audit payloads. External sends, writes,
crawler syncs, native host control and GitHub mutations remain blocked or gated.
GitHub reads are audited in real, Octopool and fixture modes.

## Real-source onboarding readiness

GitHub is the sole allowed real source. It activates only when all onboarding,
read-only, token, owner and repository conditions are true. Missing credentials
degrade to fixtures. All other external sources remain disabled/mock/dry-run.

## Priority ranking

- P0: preserve fail-closed defaults, audit requirement and secret/PII controls.
- P1: persist approvals/audits and add RBAC before expanding beta membership.
- P1: evaluate routing and grounded-metric quality against a curated dataset.
- P2: implement versioned migrations and real SQLite archive only after privacy review.
- P2: connect OpenClaw/channels only after contract and threat-model validation.
