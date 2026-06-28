# Telegram Founder Real Reply Security v1.2.2

## Model

Telegram polling is a local founder operator channel. CornerOps remains the brain, permission layer, audit system and source of truth.

## Controls

- Bot token is required but never printed.
- Founder ID discovery does not print or store full message text.
- Polling requires `TELEGRAM_OPERATOR_MODE=polling`.
- Polling requires `CORNEROPS_TELEGRAM_ALLOW_POLLING=true`.
- Real replies require `CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=true`.
- Real replies require `TELEGRAM_OPERATOR_REPLY_DRY_RUN=false`.
- Real replies require approved user and chat IDs.
- Replies are same-chat only.
- Replay protection, rate limiting and rejection tracking remain active.

## Blocked Paths

- Groups.
- Unknown users.
- Unknown chats.
- Proactive outbound messages.
- Customer channels.
- WhatsApp sends.
- Email sends.
- Supabase writes.
- Lovable mutations.
- GitHub writes.
- Order, payment, lead, quote, product and customer mutations.

## Rollback

Set:

```env
TELEGRAM_OPERATOR_ENABLED=false
CORNEROPS_TELEGRAM_ALLOW_POLLING=false
CORNEROPS_TELEGRAM_REAL_MODE=false
CORNEROPS_TELEGRAM_DRY_RUN=true
CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=false
TELEGRAM_OPERATOR_REPLY_DRY_RUN=true
```

Restart the polling process. It will exit safely with `missing_config` or dry-run status.
