# Telegram Operator v1.2

Telegram v1.2 lets the founder operate CornerOps from approved Telegram DMs while keeping replies dry-run and read-only by default.

## Required Config
- `TELEGRAM_OPERATOR_ENABLED=false` by default.
- `TELEGRAM_OPERATOR_BOT_TOKEN` must be set only locally, never committed.
- `TELEGRAM_OPERATOR_WEBHOOK_SECRET` must be set only locally.
- `TELEGRAM_OPERATOR_ALLOWED_USER_IDS` and `TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS` are required for real mode.
- `TELEGRAM_OPERATOR_REQUIRE_DM=true`.
- `TELEGRAM_OPERATOR_REJECT_GROUPS=true`.
- `TELEGRAM_OPERATOR_REPLY_DRY_RUN=true`.
- `CORNEROPS_TELEGRAM_REAL_MODE=false`.
- `CORNEROPS_TELEGRAM_DRY_RUN=true`.
- `CORNEROPS_TELEGRAM_READ_ONLY=true`.
- `CORNEROPS_TELEGRAM_FAIL_CLOSED=true`.

## Safe Commands
- `help`
- `status`
- `control tower`
- `founder daily`
- `cornermex status`
- `supabase status`
- `github status`
- `flows status`
- `orders needing attention`
- `quotes needing follow-up`
- `b2b leads`
- `payment review`
- `product issues`
- `pending approvals`
- `audit summary`
- `security summary`
- `controlled actions`
- `create internal task: <text>`
- `draft whatsapp follow-up: <text>`
- `draft email follow-up: <text>`
- `create github issue draft: <text>`

## Safety
- Unknown users, unknown chats and groups are rejected.
- Duplicate updates are rejected by replay protection.
- Rate limits are enforced before routing.
- Replies are same-chat only.
- No proactive outbound messages are enabled.
- WhatsApp and email are draft-only in v1.2.

Run:

```bash
npm run telegram:operator-check
npm run demo:telegram-operator
```
