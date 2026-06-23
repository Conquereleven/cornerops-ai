# Founder Local Runbook v0.8.1

## 1. Update and install

```bash
git switch main
git pull --ff-only origin main
npm install
npm --prefix frontend install
```

Copy `.env.example` to `.env` and replace only local placeholders. Never commit `.env`.

## 2. Safe environment

```env
CORNEROPS_WEB_CONSOLE_ENABLED=true
CORNEROPS_BIND_HOST=127.0.0.1
CORNEROPS_WEB_CONSOLE_AUTH_TOKEN=<long-random-local-token>
CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH=true
CORNEROPS_WEB_CONSOLE_LOCAL_ONLY=true
CORNEROPS_WEB_CONSOLE_READ_ONLY=true
CORNEROPS_WEB_CONSOLE_DRY_RUN=true
CORNEROPS_APPROVAL_CENTER_DRY_RUN=true
CORNEROPS_APPROVAL_CENTER_ALLOW_REAL_EXECUTION=false
CORNEROPS_PERSISTENCE_PROVIDER=file_json
CORNEROPS_PERSISTENCE_ROOT=./.cornerops/state
CORNEROPS_PERSISTENCE_FAIL_CLOSED=true
CORNEROPS_APPROVAL_STORE_PROVIDER=file_json
CORNEROPS_AUDIT_STORE_PROVIDER=file_json
CORNEROPS_REPLAY_STORE_PROVIDER=file_json
CORNEROPS_REJECTION_STORE_PROVIDER=file_json
CORNEROPS_RATE_LIMIT_STORE_PROVIDER=file_json
CORNEROPS_SESSION_STORE_PROVIDER=file_json
CORNEROPS_FILE_STORE_ATOMIC_WRITES=true
CORNEROPS_FILE_STORE_MAX_BYTES=5242880
OPENCLAW_ENABLED=false
CORNEROPS_TELEGRAM_REAL_MODE=false
CORNEROPS_FIRST_REAL_SOURCE_ENABLED=false
```

## 3. Validate

```bash
npm run qa
npm run test:frontend
npm run demo:persistence
npm run demo:v0.8
npm run build
```

## 4. Run

```bash
npm start
```

Open `http://127.0.0.1:3000/control-tower`. Enter the local token when the client requests it. Use Operator Ask for read-only questions. Approval Center may approve/reject a proposal in dry-run; it never executes it. Audit Viewer displays sanitized persisted summaries.

Stop the server with `Ctrl+C`. To disable the console, set `CORNEROPS_WEB_CONSOLE_ENABLED=false` and restart.

## Do not enable yet

- Public/non-loopback hosting
- Multiple CornerOps server processes
- Real approval execution or production writes
- Telegram real mode or customer/prospect channels
- WhatsApp/Slack sends, crawlers, native host tools or ClawHub execution
- A real business source without a dedicated verified read-only credential

If a critical store reports corruption, stop the server. Preserve `.cornerops/state`, switch to `memory` only for a clearly labeled temporary diagnostic session, and follow the rollback runbook.
