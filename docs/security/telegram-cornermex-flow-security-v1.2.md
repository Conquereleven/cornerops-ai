# Telegram + CornerMex Flow Security v1.2

v1.2 keeps CornerOps in founder-only, read-only, dry-run operation.

## Telegram Controls
- Bot token and webhook secret are never printed.
- Real mode requires token, webhook secret, allowed user IDs and allowed chat IDs.
- Groups are rejected by default.
- Replies stay dry-run by default.
- Same-chat replies are enforced.
- Replay protection, rejection tracking and rate limiting run before routing.

## CornerMex Controls
- Flow Engine uses read-only connector methods.
- Supabase writes remain blocked.
- Lovable mutations remain blocked.
- GitHub writes remain blocked.
- WhatsApp and email sends remain blocked.
- Customer/prospect channels remain disabled.

## Incident Response
1. Set `TELEGRAM_OPERATOR_ENABLED=false`.
2. Set `CORNEROPS_TELEGRAM_REAL_MODE=false`.
3. Keep `TELEGRAM_OPERATOR_REPLY_DRY_RUN=true`.
4. Rotate Telegram token outside the repo if exposure is suspected.
5. Review rejection/audit logs from Control Tower.
