# Telegram Founder Webhook Security v1.2.1

## Default Posture

- Telegram real mode is disabled.
- Replies are dry-run by default.
- Webhook setup API calls are disabled by default.
- Founder-only DM mode is required.
- Groups are rejected.
- Allowlisted user IDs and chat IDs are required for real receive readiness.

## Secret Handling

- Bot token is never printed.
- Webhook secret is never printed.
- Full chat text is not stored by founder ID help.
- `.env` files with real secrets must not be committed.

## Webhook Controls

The dry-run webhook path validates:

- webhook secret
- Telegram-shaped update
- private DM
- user allowlist
- chat allowlist
- replay protection
- rate limit
- rejection tracking
- same-chat reply payload

## Disabled

- Real Telegram replies unless explicitly enabled later.
- Telegram webhook setup unless explicitly enabled later.
- Proactive outbound messages.
- WhatsApp sends.
- Email sends.
- Customer channels.
- Supabase, Lovable, GitHub and CornerMex mutations.

## Rollback

Set:

```env
TELEGRAM_OPERATOR_ENABLED=false
CORNEROPS_TELEGRAM_REAL_MODE=false
CORNEROPS_TELEGRAM_ALLOW_WEBHOOK_SETUP=false
CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=false
```

Then restart the service and run `npm run telegram:founder-webhook-check`.
