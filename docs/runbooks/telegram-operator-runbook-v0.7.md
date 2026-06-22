# Telegram Operator Runbook v0.7

## Safe initial configuration

```env
CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED=true
CORNEROPS_OPERATOR_CHANNEL_PROVIDER=telegram
CORNEROPS_OPERATOR_CHANNEL_MODE=read_only
CORNEROPS_OPERATOR_CHANNEL_DRY_RUN=true
CORNEROPS_OPERATOR_CHANNEL_REQUIRE_APPROVAL=true
CORNEROPS_OPERATOR_REPLY_DRY_RUN=true
CORNEROPS_TELEGRAM_ACTIVATION_ENABLED=true
CORNEROPS_TELEGRAM_REAL_MODE=false
CORNEROPS_TELEGRAM_DRY_RUN=true
CORNEROPS_TELEGRAM_READ_ONLY=true
CORNEROPS_TELEGRAM_FAIL_CLOSED=true
TELEGRAM_OPERATOR_ENABLED=true
TELEGRAM_OPERATOR_BOT_TOKEN=<secret>
TELEGRAM_OPERATOR_WEBHOOK_SECRET=<high-entropy-secret>
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=<founder-private-chat-id>
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=<founder-user-id>
TELEGRAM_OPERATOR_REQUIRE_DM=true
TELEGRAM_OPERATOR_REJECT_GROUPS=true
TELEGRAM_OPERATOR_REPLY_ENABLED=true
TELEGRAM_OPERATOR_REPLY_DRY_RUN=true
CORNEROPS_REPLAY_PROTECTION_ENABLED=true
CORNEROPS_REPLAY_STORE_PROVIDER=file
CORNEROPS_REPLAY_STORE_PATH=./.cornerops/security/replay-store.json
CORNEROPS_REPLAY_FAIL_CLOSED=true
CORNEROPS_REJECTION_STORE_ENABLED=true
CORNEROPS_RATE_LIMITING_ENABLED=true
```

## Operate

```bash
npm run telegram:check
npm run demo:telegram-activation
npm run demo:v0.7
npm run control:tower
npm run cornerops -- audit denied
```

Control Tower reports last events, store health, rejections and selected source. Persistent files are excluded from Git.

Configure Telegram's webhook to the HTTPS route with the exact secret-token header. Send only from the allowlisted founder DM. Confirm sanitized inbound/outbound audits, replay state and unchanged write flags.

Rollback by disabling activation/provider flags, restarting, removing the webhook and retaining security stores for investigation. CLI and mock provider remain available.
