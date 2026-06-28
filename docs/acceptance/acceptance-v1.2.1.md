# Acceptance v1.2.1

Branch: `feature/telegram-founder-webhook-v1.2.1`

## Gate

- PR #28 was merged into `main`.
- Latest main commit: `12960475867cfc2e5dfb0975c3bc27fa537205ea`.
- v1.2 is present before v1.2.1 work.

## Commands

```bash
npm run telegram:founder-webhook-check
npm run telegram:founder-id-help
npm run demo:telegram-founder-webhook
npm run demo:v1.2.1
npm test -- tests/telegramFounderWebhookV121.test.js tests/telegramCornermexFlowV12.test.js --runInBand
```

## Current Result Without Credentials

- Telegram webhook mode: `missing_config`.
- Dry-run webhook simulation: passes.
- Real replies: disabled.
- Webhook setup: disabled.
- Founder ID help: local only, no message text storage, no auto-allowlist.

## Missing Founder Config

- `TELEGRAM_OPERATOR_BOT_TOKEN`
- `TELEGRAM_OPERATOR_WEBHOOK_SECRET`
- `TELEGRAM_OPERATOR_ALLOWED_USER_IDS`
- `TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS`

## Still Disabled

- Customer channels.
- Proactive outbound.
- WhatsApp sends.
- Email sends.
- Supabase writes.
- Lovable mutations.
- GitHub writes.
- CornerMex order/payment/lead/quote/product/customer mutations.

## Exact Founder Commands

```bash
cp .env.founder.local.example .env.founder.local
npm run telegram:founder-id-help
npm run telegram:founder-webhook-check
npm run demo:telegram-founder-webhook
npm run demo:v1.2.1
```
