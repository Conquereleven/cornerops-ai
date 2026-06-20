# Acceptance v0.7

- Branch: `feature/telegram-real-source-v0.7`
- Telegram readiness: implementation ready, disabled without environment credentials.
- First source: `mock` in the sprint environment; selector supports verified Supabase and GitHub read-only.
- Defaults: private DM, exact allowlists, read-only, action/reply dry-run, approvals, audit, PII masking and fail-closed.
- Enabled in code: persistent replay/rejection/rate stores, Telegram validation, source selector and Control Tower v0.7.
- Still disabled: real Telegram flags/replies, WhatsApp, Slack events, groups, customer channels, writes, crawlers, host automation and ClawHub.
- Known limits: file stores support one process; Postgres is a placeholder.
- Validation: 73 backend suites / 309 tests, 3 frontend files / 5 tests, syntax, typecheck and production build passed.
- Demos: Telegram activation, first source and combined v0.7 completed without real credentials, messages or writes.

Commands:

```bash
npm run telegram:check
npm run demo:telegram-activation
npm run demo:first-real-source
npm run demo:v0.7
npm run qa
```

All 33 acceptance criteria are covered by implementation, direct tests, demos,
configuration defaults and the readiness/security audits. The current source is
`mock`; Telegram real activation still requires founder credentials and HTTPS.
