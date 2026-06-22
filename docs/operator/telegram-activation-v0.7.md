# Telegram Activation v0.7

Telegram is a founder-only transport. CornerOps remains the router, data authority, policy engine and audit owner.

## BotFather and IDs

1. Create a dedicated bot with BotFather and disable unnecessary group access.
2. Obtain the founder numeric user ID and private DM chat ID.
3. Generate a high-entropy webhook secret.
4. Deploy CornerOps behind trusted HTTPS and point Telegram to `POST /api/operator-channel/telegram/webhook` with the secret-token header.

Never commit the token or secret. Initially allowlist one user and one private chat.

## Test

Use the complete environment block in [`telegram-operator-runbook-v0.7.md`](../runbooks/telegram-operator-runbook-v0.7.md), then run:

```bash
npm run telegram:check
npm run demo:telegram-activation
npm run demo:v0.7
```

Responses include source mode, approval state, audit ID and warnings. PII is masked and long answers point to CLI or Control Tower.

## Real replies

A real reply is allowed only to the same allowlisted chat/user associated with an authenticated inbound message. There is no proactive send API. After dry-run review, Telegram transport/reply dry-run flags may be disabled while `CORNEROPS_OPERATOR_CHANNEL_DRY_RUN=true`, read-only and all write flags remain enforced.

## Disable

Set `CORNEROPS_TELEGRAM_ACTIVATION_ENABLED=false`, `TELEGRAM_OPERATOR_ENABLED=false` and `CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED=false`; restart, remove the webhook and rotate credentials if needed.

Groups are rejected because they expand the trust boundary. WhatsApp remains disabled because it is customer-facing and outside this founder-only beta.
