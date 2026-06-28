# Acceptance v1.2

## Branch
- `feature/telegram-cornermex-flow-engine-v1.2`

## Merge Gate
- PR #27 was merged before v1.2 started.
- Latest main commit at branch creation: `a0234e4a245961d244af1e18df9638f9c9bedf93`.

## Commands
- `npm run telegram:operator-check`
- `npm run demo:telegram-operator`
- `npm run demo:cornermex-flows`
- `npm run demo:message-drafts`
- `npm run demo:v1.2`
- `npm test -- tests/telegramCornermexFlowV12.test.js --runInBand`
- Backend Jest full: 88 suites / 409 tests passed.
- Syntax check: 463 JavaScript files passed.
- Frontend typecheck: passed.
- Frontend Vitest: 4 files / 7 tests passed.
- Frontend build: passed.

## Current Modes
- Telegram mode: disabled/dry-run unless founder credentials and allowlists are supplied.
- CornerMex flow mode: follows connector mode (`mock`, `repo_discovered`, `real_read_only` or `mixed`).
- Message drafts: `local_internal`, `not_sendable_in_v1.2`.

## What Remains Disabled
- Production writes.
- Lovable mutations.
- Supabase writes.
- GitHub writes.
- WhatsApp sends.
- Email sends.
- Customer channels.
- Proactive outbound messages.
- Native tools.
- ClawHub execution.

## Founder Commands
```bash
npm run telegram:operator-check
npm run demo:v1.2
```

For real Telegram dry-run testing, provide only local env values:

```bash
TELEGRAM_OPERATOR_ENABLED=true
TELEGRAM_OPERATOR_BOT_TOKEN=...
TELEGRAM_OPERATOR_WEBHOOK_SECRET=...
TELEGRAM_OPERATOR_ALLOWED_USER_IDS=...
TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS=...
CORNEROPS_TELEGRAM_REAL_MODE=false
TELEGRAM_OPERATOR_REPLY_DRY_RUN=true
```
