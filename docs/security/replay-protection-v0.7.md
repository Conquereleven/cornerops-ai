# Replay Protection v0.7

Telegram can retry updates, attackers can replay captured webhooks, and restarts erase in-memory duplicate knowledge. Replay is therefore rejected before routing.

CornerOps stores provider, external update/message IDs, chat/user IDs, first-seen/expiry timestamps and a SHA-256 checksum. It never stores raw message text in replay records. The default atomic JSON file is bounded under `.cornerops/security`, mode `0600`, with a 24-hour TTL.

Real Telegram mode requires file persistence, replay protection, rejection tracking, rate limiting and fail-closed controls. An unavailable replay store denies the message.

Rejected identities, chats, groups, duplicates, rate limits and blocked policies are persisted with masked, truncated previews and 30-day retention. Telegram-token-shaped strings, emails and phones are redacted. Rate limiting uses a persistent token bucket keyed by a hash of provider/chat/user.

Duplicate and rate-limit denials create sanitized audits. Control Tower shows store health and rejection totals.

Incident response:

1. Disable Telegram activation and remove the webhook.
2. Rotate bot/webhook credentials.
3. Preserve `.cornerops/security` for investigation.
4. Review replay, rejection and audit records.
5. Restore a healthy store and restart in dry-run.

File storage is single-process. Migrate to a transactional shared store before multiple replicas.
