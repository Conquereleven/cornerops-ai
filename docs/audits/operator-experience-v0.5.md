# Operator Experience Audit v0.5

## Current interaction surfaces

Before v0.5, CornerOps could be exercised through agent/data demos, Express APIs, the customer-oriented chat dashboard and Control Tower JSON reports. These surfaces proved the architecture but did not provide one coherent founder workflow.

Available pre-v0.5 commands included `demo:agents`, `demo:beta`, `demo:business-data`, `demo:control-tower`, `control:tower` and `control:tower:beta`. APIs exposed chat, read-only data, context, GitHub, approvals, audit and Control Tower. The frontend exists, but it is aimed at the operational dashboard/chat rather than the new operator contract.

## Gaps and unsafe UX areas

- No single natural-language operator entry point.
- JSON-heavy output did not consistently show source mode, approval status or audit ID.
- Approvals and audit review required knowledge of lower-level APIs.
- CLI invocations had no short-term operator session.
- Unknown commands could be mistaken for supported workflows.
- Existing internal write APIs belong to legacy/admin surfaces and must not be presented as v0.5 operator capabilities.
- A web operator page would add scope before the CLI contract is stable.

## v0.5 recommendation and implementation

Use the local CLI as the canonical beta surface. It routes business questions through AgentOrchestrator and uses approved internal services for health, Control Tower, approvals and audit. Every request receives an operator audit record before execution. The optional API is implemented but disabled by default; no web operator page is enabled.

## Ready now

- Help, briefing, B2B follow-up/drafts, quotes/orders/manual-payment review.
- GitHub/Codex summary using mock or configured read-only GitHub.
- Control Tower, data/context health, pending approvals and audit review.
- In-memory approval approve/reject simulation without action execution.
- In-memory operator sessions containing sanitized metadata only.

## Source status

| Source | Current status | Operator label |
| --- | --- | --- |
| Business data | Fixtures; real onboarding disabled | `mock` |
| GitHub | Disabled; fixture fallback | `mock` |
| Context | Mock/local fixtures | `mock` |
| Approvals/audit | In memory plus sanitized fixtures | `mock` |
| Slack/WhatsApp/Telegram/Notion | Disabled | `disabled` |
| OpenClaw operator channel | Disabled | `disabled` |
| Crawlers/native tools/ClawHub execution | Disabled | `disabled` |

## Not ready

- Public or remote operator API exposure.
- Dedicated `/operator` web UI.
- Durable sessions, approvals or audit persistence.
- Real business data until a dedicated read-only credential and schema validation exist.
- Any message send, production mutation, deploy, crawler sync or native host automation.
