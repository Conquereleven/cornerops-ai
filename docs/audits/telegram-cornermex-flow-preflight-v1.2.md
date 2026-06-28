# Telegram + CornerMex Flow Preflight v1.2

## Merge Gate
- PR #27: merged.
- Merge commit on main: `a0234e4a245961d244af1e18df9638f9c9bedf93`.
- v1.1.3 status: present in latest `main`.
- CI before merge: 2/2 checks successful.

## Verification
- `cornermex:supabase-read-only-check`: passed without Supabase credentials.
- `demo:v1.1.3`: passed without Supabase credentials.
- `founder:daily`: passed without credentials.
- Writes/external sends: blocked.

## Telegram Readiness
- Real Telegram mode remains disabled by default.
- Replies remain dry-run by default.
- Founder allowlists are required before real mode can be considered.
- Groups are rejected by default.
- Replay protection, rejection tracking and rate limiting are required safety controls.

## CornerMex Flow Readiness
- Connector source mode without Supabase credentials: `mock` locally, `repo_discovered` when founder Lovable repo env is configured.
- Flow Engine will use `LovableCornerMexConnector`.
- Flow output must label source mode and never imply live data when using mock/repo-only context.

## Risks
- Missing Telegram bot token, webhook secret and founder allowlists.
- Missing Supabase URL and anon/read-only key for `real_read_only`.
- WhatsApp/email/customer sends must remain disabled.

## Implementation Plan
1. Add Telegram v1.2 config validator and readiness script.
2. Extend operator commands for Telegram founder DM usage.
3. Add CornerMex Flow Engine using read-only connector data.
4. Add local-only message drafts for WhatsApp/email.
5. Extend Control Tower and founder daily.
6. Add demos, tests and concise operator/security docs.
