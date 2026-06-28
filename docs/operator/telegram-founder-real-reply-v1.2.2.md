# Telegram Founder Real Reply Pilot v1.2.2

v1.2.2 makes CornerOps usable through a local Telegram polling process. It does not require HTTPS, a public domain, a tunnel or webhook setup.

## Founder Setup

1. Create a Telegram bot with BotFather.
2. Put the bot token in local `.env` only:

```env
TELEGRAM_OPERATOR_BOT_TOKEN=
```

3. Discover founder IDs:

```bash
npm run telegram:founder-id-discovery
```

4. Send a private DM to the bot.
5. Copy the candidate IDs into local `.env`:

```env
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=
```

6. Start polling in dry-run:

```bash
npm run telegram:founder-polling
```

7. After confirming the allowlist, enable same-chat real replies only:

```env
TELEGRAM_OPERATOR_ENABLED=true
TELEGRAM_OPERATOR_MODE=polling
CORNEROPS_TELEGRAM_ALLOW_POLLING=true
CORNEROPS_TELEGRAM_REAL_MODE=true
CORNEROPS_TELEGRAM_DRY_RUN=false
CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=true
TELEGRAM_OPERATOR_REPLY_DRY_RUN=false
```

8. Run polling again:

```bash
npm run telegram:founder-polling
```

## Supported Commands

- `help`
- `status`
- `founder daily`
- `cornermex status`
- `flows status`
- `orders needing attention`
- `quotes needing follow-up`
- `b2b leads`
- `payment review`
- `product issues`
- `pending approvals`
- `audit summary`
- `security summary`
- `draft whatsapp follow-up: <text>`
- `draft email follow-up: <text>`
- `create internal task: <text>`

## Safety Defaults

- Polling is disabled until `CORNEROPS_TELEGRAM_ALLOW_POLLING=true`.
- Real replies are disabled until `CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=true` and `TELEGRAM_OPERATOR_REPLY_DRY_RUN=false`.
- Replies are only sent to the same approved founder chat.
- Groups are rejected.
- Unknown users and chats are rejected.
- No proactive messages.
- No customer channels.
- No WhatsApp sends.
- No email sends.
- No production writes.
