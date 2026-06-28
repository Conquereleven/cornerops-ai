# Acceptance v1.2.2

Branch: `feature/telegram-founder-real-reply-v1.2.2`

## Gate

- PR #29 merged into `main`.
- v1.2.1 is present before v1.2.2 work.

## Commands

```bash
npm run telegram:founder-id-discovery
npm run telegram:founder-polling
npm run demo:telegram-founder-real-reply
npm run demo:v1.2.2
npm test -- tests/telegramFounderRealReplyV122.test.js tests/telegramFounderWebhookV121.test.js tests/telegramCornermexFlowV12.test.js --runInBand
```

## Results Without Credentials

- `telegram:founder-id-discovery`: exits safely with `missing_config`.
- `telegram:founder-polling`: exits safely with missing token, polling flag and allowlist.
- `demo:telegram-founder-real-reply`: simulates approved founder update, unknown user, unknown chat, group, replay duplicate, rate limit and dry-run reply.
- `demo:v1.2.2`: reports polling status, Control Tower status and founder daily commands.

## Real Reply Requirements

```env
TELEGRAM_OPERATOR_ENABLED=true
TELEGRAM_OPERATOR_MODE=polling
TELEGRAM_OPERATOR_BOT_TOKEN=
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=
CORNEROPS_TELEGRAM_ALLOW_POLLING=true
CORNEROPS_TELEGRAM_REAL_MODE=true
CORNEROPS_TELEGRAM_DRY_RUN=false
CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=true
TELEGRAM_OPERATOR_REPLY_DRY_RUN=false
```

## Still Disabled

- Groups.
- Customer channels.
- Proactive outbound.
- WhatsApp sends.
- Email sends.
- Supabase writes.
- Lovable mutations.
- GitHub writes.
- CornerMex data mutations.
