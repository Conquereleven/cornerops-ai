# Internal Beta Operator Workflow v0.4

## Start safely

1. Install dependencies and keep the default mock/read-only flags.
2. Run `npm run qa`.
3. Run `npm run control:tower:beta` and confirm `writesBlocked=true`, `externalSendsBlocked=true` and `readOnlyVerified=true`.
4. Start the application with `npm run dev` only on a trusted local interface.

## Daily operation

1. Run `npm run demo:beta` or ask the daily briefing agent for today's priorities.
2. Check source labels; `mock` and `real_read_only` are valid, unlabeled business metrics are not.
3. Review `/api/control-tower/audit-summary` and `/api/control-tower/approvals`.
4. Treat drafts as drafts. No outbound message or mutation is authorized in v0.4.

## Enable business data read-only

Follow the business-data onboarding runbook. Use a dedicated read-only credential, verify database-level denial of writes, inspect schema contracts, then enable `CORNEROPS_BUSINESS_DATA_ENABLED=true`. Do not use the service-role key.

## Enable GitHub read-only

Follow `docs/runbooks/first-real-source-github.md`. Keep every `GITHUB_ALLOW_*` flag false.

## Keep disabled

Slack, WhatsApp, Telegram, Notion, Google Workspace, crawlers, local private archives, native host tools, ClawHub execution, deploys and OpenClaw real execution remain disabled.

## Shutdown and rollback

Stop the Node processes, set business/GitHub/OpenClaw/context/crawler flags false, remove read-only credentials from the runtime secret store, restart and verify Control Tower reports mock mode. No production rollback query is required.
