# Control Tower Safety v0.8.1

## Verified controls

- Disabled by default; the server now binds to `127.0.0.1` by default.
- Auth is required when the console is enabled; missing and invalid tokens return `401`.
- Auth tokens are not included in application logs or static reports.
- Console, Operator Ask and Approval Center remain read-only/dry-run.
- Approval decisions update approval state but never execute the proposed action.
- No write, payment mutation, external-send or deployment endpoint is exposed by Control Tower.
- Operator Ask uses `OperatorCommandRouter`, policies and audit services.
- Audit Viewer reads persisted sanitized summaries and masks private content, secrets and PII.
- Static HTML generation contains no configured secrets.
- Telegram, WhatsApp, Slack customer channels, crawlers, native tools and real sources remain disabled by default.

## Required safe configuration

```env
CORNEROPS_WEB_CONSOLE_ENABLED=true
CORNEROPS_BIND_HOST=127.0.0.1
CORNEROPS_WEB_CONSOLE_AUTH_TOKEN=<long-local-token>
CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH=true
CORNEROPS_WEB_CONSOLE_LOCAL_ONLY=true
CORNEROPS_WEB_CONSOLE_READ_ONLY=true
CORNEROPS_WEB_CONSOLE_DRY_RUN=true
CORNEROPS_APPROVAL_CENTER_DRY_RUN=true
CORNEROPS_APPROVAL_CENTER_ALLOW_REAL_EXECUTION=false
```

Do not expose port 3000 to a public interface. Stop the process and investigate if persistence health fails, a critical file is corrupt, writes become enabled, or auth can be bypassed.
