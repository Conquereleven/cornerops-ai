# Internal Beta Scope v0.4

## Allowed

- Read sanitized mock or verified read-only business data.
- Read GitHub with a least-privilege token.
- Read mock context and operational documentation.
- Generate briefings, drafts, recommendations and issue drafts.
- View Control Tower, audit logs and pending approvals.

## Not allowed

- Send external messages or email.
- Write production data or change lead, quote, order or payment status.
- Run real crawler syncs or private Slack, WhatsApp, Telegram or Notion archives.
- Run native host tools, install external skills automatically or trigger deploys.
- Use service-role credentials for business-data onboarding.
- Execute a proposed action merely because it has an approval record.

CornerOps remains the source of truth, orchestrator, memory, policy and audit system. OpenClaw and other ecosystem components are controlled capability layers only.
