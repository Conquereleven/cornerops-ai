# Acceptance v0.8

- Branch: `feature/control-tower-web-console-v0.8`
- Implementation path: existing React/Vite UI plus Express read-only API and generated local HTML fallback.
- CornerOps remains the source of truth; the console is an operator surface only.

## Delivered

- Unified Control Tower v0.8 report.
- `/control-tower` console with safety, Telegram, sources, agents, approvals, audit, security and Ask.
- Versioned `/api/control-tower/v0.8/*` endpoints and `/api/operator/v0.8/ask`.
- Local/auth/read-only/dry-run guard.
- Approval dry-run decisions with audit and no execution.
- Static `.cornerops/reports/control-tower-v0.8.html` fallback.

## Validation commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:frontend
npm run build
npm run demo:control-tower-web
npm run demo:approval-center
npm run demo:audit-viewer
npm run demo:v0.8
git diff --check
rg -n --hidden --glob '!node_modules/**' --glob '!frontend/node_modules/**' --glob '!.git/**' --glob '!docs/acceptance/acceptance-v0.8.md' '(ghp_|github_pat_|sk-|TELEGRAM_OPERATOR_BOT_TOKEN=[^[:space:]]+)' .
```

Final validation: syntax passed for 352 JavaScript files; 77 backend suites / 326 tests passed; 4 frontend files / 7 tests passed; frontend typecheck and production build passed. All four v0.8 demos exited successfully without credentials.

Automated DOM/UI tests cover the console and interactions. The temporary local server started successfully; in-app visual automation was unavailable in this session, so supervised browser acceptance remains explicitly pending in the beta checklist.

## Safety defaults

The web console is disabled, localhost-only, auth-required, read-only, dry-run and fail-closed. Real approval execution, writes, external sends, WhatsApp, customer channels, crawlers, native tools and ClawHub execution remain disabled.

## Known limits

Token auth is single-operator/local, approvals and most audit events are process-local, persistent Telegram stores are single-process, and the HTML report is a point-in-time snapshot.

## Founder commands

```bash
npm run qa
npm run demo:v0.8
npm run build
npm start
# open http://127.0.0.1:3000/control-tower
```
