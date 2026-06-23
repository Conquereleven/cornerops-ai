# QA v0.8.1

## Baseline and merge evidence

- PR #19 branch CI: passed.
- PR #19 post-merge `main` CI: passed.
- PR #20 branch CI before and after base synchronization: passed.
- PR #20 post-merge `main` CI: passed.
- Local merge-tree simulation: no conflicts; output trees matched both feature branches.

## Local results

| Check | Result |
| --- | --- |
| Syntax | 359 JavaScript files passed |
| Backend | 78 suites / 333 tests passed |
| Frontend | 4 files / 7 tests passed |
| TypeScript | Passed |
| Vite production build | Passed, 1,628 modules transformed |
| Persistence demo | Restart recovery passed; no secrets/PII; no real execution |
| v0.8 demos | Passed on the merged baseline |
| Server/API smoke | Loopback bind, `/health`, `/control-tower`, authenticated and rejected API requests passed |
| Restart smoke | 28 recent sanitized events recovered through Control Tower after process restart |
| Git diff check | Passed |
| Secret scan | Passed |

Commands exercised directly or through `scripts/run-qa.js`:

```bash
npm ci                         # clean GitHub Actions runners
npm --prefix frontend ci      # clean GitHub Actions runners
npm run lint
npm run typecheck
npm test
npm run test:frontend
npm run build
npm run demo:persistence
npm run demo:v0.8
npm start
git diff --check
```

The bundled local runtime did not include an npm executable, so a fresh local `npm install` was not rerun. GitHub Actions completed `npm ci` and `npm --prefix frontend ci` on clean runners for both PRs and post-merge `main`. Existing installed dependencies were used for local QA.

## Fixes found during hardening

- The first generic persistence sanitizer treated the token-bucket field `tokens` as a credential. It was narrowed to preserve that numeric rate-limit counter while continuing to redact credential token keys and token-shaped strings.
- One local typecheck command used a duplicated `frontend/` path. The corrected command passed; this was a QA invocation error, not a source failure.
- One sandboxed QA attempt blocked Supertest's ephemeral HTTP socket with `EPERM`. The full QA command was rerun with local socket permission and passed.

## Remaining risks

- `file_json` serializes transactions only inside one Node process. Do not run multiple writers.
- Visual acceptance still requires a founder check on the target machine and browser.
- GitHub Actions reports a non-blocking runtime deprecation annotation for the internal runtime of `actions/checkout@v4` and `actions/setup-node@v4`.
