# Telegram Founder Local Activation v1.2.2

1. Create Telegram bot with BotFather.
2. Copy bot token into local `.env`.
3. Run:

```bash
npm run telegram:founder-id-discovery
```

4. Send a DM to the bot.
5. Copy printed `user_id` and `chat_id`.
6. Add IDs to `.env`.
7. Start first in safe mode.
8. Enable real same-chat replies only after allowlist is confirmed.
9. Run:

```bash
npm run telegram:founder-polling
```

10. Test commands:

- `help`
- `status`
- `founder daily`
- `cornermex status`
- `flows status`

## Local `.env` Template

```env
TELEGRAM_OPERATOR_ENABLED=true
TELEGRAM_OPERATOR_MODE=polling
TELEGRAM_OPERATOR_BOT_TOKEN=
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=
TELEGRAM_OPERATOR_REQUIRE_DM=true
TELEGRAM_OPERATOR_REJECT_GROUPS=true
TELEGRAM_OPERATOR_REPLY_ENABLED=true
TELEGRAM_OPERATOR_REPLY_DRY_RUN=false

CORNEROPS_TELEGRAM_ALLOW_POLLING=true
CORNEROPS_TELEGRAM_REAL_MODE=true
CORNEROPS_TELEGRAM_DRY_RUN=false
CORNEROPS_TELEGRAM_READ_ONLY=true
CORNEROPS_TELEGRAM_FAIL_CLOSED=true
CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=true
```

## Safety Reminders

- Never commit `.env`.
- Never paste bot token in GitHub.
- Never paste bot token in PR descriptions.
- No groups.
- No customer channels.
- No proactive messages.
- No WhatsApp sends.
- No email sends.
- No production writes.
