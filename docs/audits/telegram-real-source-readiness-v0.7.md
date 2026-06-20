# Telegram + Real Source Readiness v0.7

## Decision

Telegram private DM remains the selected operator channel. The first-source order is `business_db,github`; without approved credentials the selector falls back to `mock`. No credential was added and no real message was sent during this sprint.

## Readiness matrix

| Capability | Status | Evidence / gap |
| --- | --- | --- |
| Telegram webhook | Ready, disabled | Existing Express route, constant-time secret check, no polling. |
| Private DM / allowlists | Ready | Exact chat and user IDs; groups denied by default. |
| Replay protection | Ready | Root-bounded atomic JSON store, TTL cleanup, restart test, fail-closed real mode. |
| Rejection tracking | Ready | Persistent sanitized records, 30-day retention, Control Tower summary. |
| Rate limiting | Ready | Persistent token bucket by provider/chat/user. |
| Control Tower | Ready | Telegram stores, rejection count and source selection shown. |
| Business DB | Conditional | Supabase read-only path is usable with `SUPABASE_URL` and `SUPABASE_READONLY_KEY`; Postgres remains a safe placeholder. |
| GitHub | Conditional | Read-only API path is usable with token, owner and repo. Writes remain blocked. |
| First real source now | Mock | No approved real credentials are present in the sprint environment. |

## Recommended activation path

1. Configure one founder bot, private chat ID, user ID and webhook secret.
2. Keep all action and reply dry-run flags enabled.
3. Run `npm run telegram:check` and `npm run demo:telegram-activation`.
4. Deploy the HTTPS webhook and observe inbound/replay/rejection/rate-limit audits.
5. Configure either a Supabase read-only key or GitHub read-only token.
6. Run `npm run demo:first-real-source` and inspect Control Tower.
7. Only after review, disable Telegram transport dry-run flags; keep `CORNEROPS_OPERATOR_CHANNEL_DRY_RUN=true` and all write flags false.

## Risks

- File stores are safe for one process, not a horizontally scaled deployment.
- Filesystem loss removes replay/rejection history; use a transactional shared store before scaling.
- Telegram authenticity also depends on trusted HTTPS termination.
- Postgres URL support is not connected to a driver; use verified Supabase read-only or GitHub.

## Remains disabled

WhatsApp, Slack events, groups, customer/prospect channels, proactive sends, business mutations, GitHub writes, crawlers, native host automation and ClawHub execution.
