# QA Status v0.3

| Command | Result | Failure/root cause | Fix | Remaining risk |
| --- | --- | --- | --- | --- |
| `npm ci` | Pass | Initial temporary npm wrapper was incomplete; frontend lacked `node` in PATH | Restored npm runtime and repeated with bundled Node | Deprecation warnings remain in transitive dependencies |
| `npm run lint` | Pass | None | N/A | Syntax check is not a semantic linter |
| `npm run typecheck` | Pass | None | N/A | Backend remains JavaScript |
| `npm test` | Pass | Two legacy GitHub expectations failed during hardening | Updated to assert read-only denial | External API is mocked in tests |
| `npm run test:frontend` | Pass | None | N/A | UI coverage remains focused |
| `npm run build` | Pass | None | N/A | Bundle budget is not enforced |
| `npm run demo:agents` | Pass | None | N/A | Deterministic mock/dry-run output |
| `npm run demo:real-data` | Pass | None | N/A | Uses fixtures unless explicitly configured |
| `npm run demo:ecosystem` | Pass | None | N/A | All actions simulated |
| `npm run demo:context` | Pass | None | N/A | Local archives are mock-backed |
| `npm run demo:context-health` | Pass | None | N/A | SQLite adapter remains stubbed |
| `npm run control:tower` | Pass | Old script was not a system report | Added canonical report CLI/API | Connection status is configuration-level |
| `npm run demo:beta` | Pass | Missing before v0.3 | Added safe combined demo | No real credentials used |

Final counts and command output are recorded in the pull request validation
section: 54 backend suites / 185 tests and 3 frontend files / 5 tests. All
validation is designed to pass without external credentials.
