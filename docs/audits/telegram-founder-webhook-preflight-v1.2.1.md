# Telegram Founder Webhook Preflight v1.2.1

Date: 2026-06-28

## Gate

- PR #28: merged into `main`.
- Latest main commit after merge: `12960475867cfc2e5dfb0975c3bc27fa537205ea`.
- v1.2 status: present in `main`.

## Verification

- `npm run telegram:operator-check`: passes without credentials in dry-run mode.
- `npm run demo:telegram-operator`: passes without credentials.
- `npm run demo:v1.2`: passes without credentials.
- `npm run founder:daily`: passes without credentials.

## Current Telegram Mode

- Real mode: disabled.
- Reply mode: dry-run.
- Founder webhook readiness: `missing_config`.
- Missing config: `TELEGRAM_OPERATOR_BOT_TOKEN`, `TELEGRAM_OPERATOR_WEBHOOK_SECRET`, `TELEGRAM_OPERATOR_ALLOWED_USER_IDS`, `TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS`.

## Risks

- Real replies must stay disabled unless explicitly approved through `CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=true`.
- Webhook setup must not call Telegram APIs unless `CORNEROPS_TELEGRAM_ALLOW_WEBHOOK_SETUP=true`.
- Unknown users, unknown chats and groups must fail closed.

## Implementation Plan

1. Add founder webhook config validation.
2. Add dry-run webhook verification demo.
3. Add founder ID discovery help without storing message text.
4. Extend Control Tower and founder daily Telegram readiness.
5. Add focused tests and concise operator/security docs.
