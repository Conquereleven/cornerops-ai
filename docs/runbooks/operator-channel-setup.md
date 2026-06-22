# Operator Channel Setup

## Mock channel

```bash
npm run demo:operator-channel
```

This simulates approved, rejected and write-request messages without credentials or network sends.

## Telegram dry-run setup

Keep secrets outside Git and set:

```env
CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED=true
CORNEROPS_OPERATOR_CHANNEL_PROVIDER=telegram
CORNEROPS_OPERATOR_CHANNEL_MODE=read_only
CORNEROPS_OPERATOR_CHANNEL_DRY_RUN=true
CORNEROPS_OPERATOR_CHANNEL_REQUIRE_APPROVAL=true
CORNEROPS_OPERATOR_REPLY_ENABLED=true
CORNEROPS_OPERATOR_REPLY_DRY_RUN=true
CORNEROPS_OPERATOR_REQUIRE_ALLOWLIST=true
CORNEROPS_OPERATOR_ALLOWED_USER_IDS=<founder-user-id>
CORNEROPS_OPERATOR_ALLOWED_CHAT_IDS=<private-chat-id>

TELEGRAM_OPERATOR_ENABLED=true
TELEGRAM_OPERATOR_BOT_TOKEN=<secret>
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=<private-chat-id>
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=<founder-user-id>
TELEGRAM_OPERATOR_WEBHOOK_SECRET=<high-entropy-secret>
TELEGRAM_OPERATOR_DRY_RUN=true
```

Expose `POST /api/operator-channel/telegram/webhook` through trusted HTTPS and configure Telegram to send the same secret in `X-Telegram-Bot-Api-Secret-Token`. First run `npm run demo:real-operator-channel`; it validates readiness without sending.

Only after dry-run webhook events, allowlist rejections, audit IDs and Control Tower status have been reviewed may the two reply dry-run flags be deliberately changed. Never disable read-only, approval, allowlist, audit, PII or fail-closed controls.

## OpenClaw bridge

Set provider `openclaw` only in an isolated dry-run deployment with `OPENCLAW_OPERATOR_CHANNEL_ENABLED=true`, `OPENCLAW_OPERATOR_CHANNEL_DRY_RUN=true` and `OPENCLAW_OPERATOR_CHANNEL_ALLOWLIST_ONLY=true`. Bridge inputs require an id, text, user id and channel/chat id. They still traverse the same CornerOps policy and router.

## Slack

Slack is intentionally not wired in v0.6. Token/signing-secret variables are reserved, but there is no enabled event route. Do not point Slack events at a generic endpoint.

## Local verification

```bash
npm run lint
npm test
npm run demo:operator-channel
npm run control:tower
```

Verify provider, dry-run, allowlist counts, rejected messages and last inbound/outbound timestamps.

## Rollback

Set `CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED=false`, `TELEGRAM_OPERATOR_ENABLED=false` and `OPENCLAW_OPERATOR_CHANNEL_ENABLED=false`, then restart the service. Remove the Telegram webhook at the provider and rotate its token/secret if exposure is suspected. The CLI remains available independently.
