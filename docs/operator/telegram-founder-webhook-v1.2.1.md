# Telegram Founder Webhook v1.2.1

v1.2.1 prepares a real Telegram-shaped founder webhook path while keeping replies dry-run by default.

## Setup Inputs

Create a bot in BotFather and keep these values local only:

```env
TELEGRAM_OPERATOR_ENABLED=false
TELEGRAM_OPERATOR_BOT_TOKEN=
TELEGRAM_OPERATOR_WEBHOOK_SECRET=
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=
TELEGRAM_OPERATOR_REQUIRE_DM=true
TELEGRAM_OPERATOR_REJECT_GROUPS=true
TELEGRAM_OPERATOR_REPLY_ENABLED=true
TELEGRAM_OPERATOR_REPLY_DRY_RUN=true

CORNEROPS_TELEGRAM_REAL_MODE=false
CORNEROPS_TELEGRAM_DRY_RUN=true
CORNEROPS_TELEGRAM_READ_ONLY=true
CORNEROPS_TELEGRAM_FAIL_CLOSED=true
CORNEROPS_TELEGRAM_ALLOW_WEBHOOK_SETUP=false
CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=false
```

## Commands

```bash
npm run telegram:founder-webhook-check
npm run telegram:founder-id-help
npm run demo:telegram-founder-webhook
npm run demo:v1.2.1
```

## Founder ID Flow

1. Create the bot in BotFather.
2. Send a private DM from the founder Telegram account to the bot.
3. Use local dry-run capture/help to identify candidate user/chat IDs.
4. Set `TELEGRAM_OPERATOR_ALLOWED_USER_IDS` and `TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS` locally.
5. Keep real replies and webhook setup disabled until explicitly approved.

## Safety

- Groups are rejected.
- Unknown users and chats are rejected.
- Duplicate updates are rejected.
- Rate limits apply.
- Dry-run reply payloads are generated but not sent.
- No proactive outbound messages.
- No customer channels.
- No CornerMex writes.
