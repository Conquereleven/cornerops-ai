# Founder Local Env v1.0

Use `.env.founder.local.example` as the safe starting point:

```bash
cp .env.founder.local.example .env
```

Set `CORNEROPS_WEB_CONSOLE_AUTH_TOKEN` to a long private local value. Do not commit `.env`.

## Key variables

- `CORNEROPS_BIND_HOST=127.0.0.1`: binds the server to the local machine only.
- `CORNEROPS_WEB_CONSOLE_ENABLED=true`: enables the local Control Tower.
- `CORNEROPS_WEB_CONSOLE_AUTH_TOKEN`: local password-like token for the console. Never print or commit it.
- `CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH=true`: requires the token.
- `CORNEROPS_WEB_CONSOLE_LOCAL_ONLY=true`: keeps the console local.
- `CORNEROPS_WEB_CONSOLE_READ_ONLY=true`: blocks write-style console behavior.
- `CORNEROPS_WEB_CONSOLE_DRY_RUN=true`: keeps console actions simulated.
- `CORNEROPS_PERSISTENCE_PROVIDER=file_json`: stores beta state in local JSON.
- `CORNEROPS_PERSISTENCE_ROOT=./.cornerops/state`: local state folder.
- `CORNEROPS_BACKUP_ROOT=./.cornerops/backups`: local backup folder.
- `CORNEROPS_CONTROLLED_ACTIONS_ENABLED=true`: shows allowlisted controlled actions.
- `CORNEROPS_CONTROLLED_ACTIONS_DRY_RUN=true`: prevents real execution by default.
- `CORNEROPS_CONTROLLED_ACTIONS_REQUIRE_APPROVAL=true`: requires human approval before execution.
- `CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_ENABLED=false`: keeps real GitHub issue creation off.
- `GITHUB_ENABLED=false`, `GITHUB_READ_ONLY=true`, `GITHUB_DRY_RUN=true`, `GITHUB_ALLOW_ISSUE_CREATION=false`: GitHub remains safe/draft-only.
- `OPENCLAW_ENABLED=false`: OpenClaw is not required for founder local beta.
- `CORNEROPS_TELEGRAM_REAL_MODE=false`: Telegram cannot send real operator messages.
- `CORNEROPS_FAIL_CLOSED=true`: safety failures deny execution.
- `CORNEROPS_PII_MASKING=true` and `CORNEROPS_LOG_SANITIZATION=true`: protect logs and local exports.

Run `npm run founder:setup-check` after editing `.env`.
