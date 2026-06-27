# Acceptance v0.9

## Release

- Branch: `feature/controlled-actions-approvals-v0.9`
- Base: merged PR #21 at `9280482`
- Scope: controlled GitHub issue, local note/task, approvals, idempotency, API/CLI, Control Tower, demos and docs

## Verification

```bash
npm run lint
npm test
npm run test:frontend
npm run typecheck
npm run build
npm run demo:controlled-actions
npm run demo:github-issue-action
npm run demo:internal-notes-tasks
npm run demo:v0.9
git diff --check
```

Observed before PR publication:

- Syntax check passed for 387 JavaScript files.
- Backend Jest passed: 82 suites, 353 tests.
- Frontend TypeScript passed: `tsc --noEmit`.
- Frontend Vitest passed: 4 files, 7 tests.
- Frontend production build passed: Vite transformed 1628 modules.
- All four v0.9 demos passed without credentials.
- `git diff --check` passed.
- Local HTTP smoke on `127.0.0.1:3099` passed for `/api/health`, `/api/control-tower/v0.9/status`, `/api/actions` and GitHub issue draft creation.
- In-app browser QA could not start because the Browser plugin runtime returned `missing field sandboxPolicy` before connecting; API/build evidence was used as the local QA fallback.

## Accepted behavior

- Three and only three controlled actions are registered.
- All default disabled/dry-run/approval flags are safe.
- Approval payload checksum, constrained lifecycle and idempotency are enforced.
- GitHub draft/approval/dry-run work; real GitHub creation is blocked by default.
- Local note/task real execution is possible only in explicitly enabled isolated local persistence.
- Agent proposals do not directly invoke handlers.
- API is local-console authenticated and Control Tower exposes v0.9 state.
- Demos run without credentials or external side effects.

## Blocked behavior

Payment/order/lead/quote mutations, business DB writes, customer/supplier messages, WhatsApp, external email, PR merge, workflows, deploys, native tools and ClawHub execution remain blocked.

## Known limits

- File JSON supports one process only.
- Authentication remains a single local operator token.
- GitHub rollback is manual.
- No real GitHub action was used for acceptance.

## Founder commands

```bash
npm install
npm --prefix frontend install
npm run qa
npm run demo:v0.9
npm run build
npm start
```

Open `http://127.0.0.1:3000/control-tower` and verify controlled actions are disabled or dry-run, real execution is blocked, idempotency is healthy and no critical warning is present.

For an API smoke equivalent:

```bash
curl -H "Authorization: Bearer $CORNEROPS_WEB_CONSOLE_AUTH_TOKEN" \
  http://127.0.0.1:3000/api/control-tower/v0.9/status

curl -H "Authorization: Bearer $CORNEROPS_WEB_CONSOLE_AUTH_TOKEN" \
  http://127.0.0.1:3000/api/actions
```
