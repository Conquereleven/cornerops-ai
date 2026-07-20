# CO-1.16-R2 evidence ledger

| Claim | Evidence source | Exact SHA | Command/test | Result | Remaining uncertainty |
|---|---|---|---|---|---|
| Canonical fixtures match reviewed source | `Conquereleven/corner-mex-uae` canonical documents | `a173dfc6d5b0d8b62710a1ce604d6df9ea63c373` | `cornerMexControlPlaneV116.test.js` SHA-256 and adapter tests | PASS | None |
| Stable condition identity is independent of evidence versions | Work Queue focused tests | Remediation working tree; final SHA recorded in PR | Memory test plus disposable PostgreSQL on `127.0.0.1:55436` | PASS | PostgreSQL test is environment-gated in the full suite; its focused real-database run passed |
| Dangerous production governance fails closed | Canonical adapter focused tests | Remediation working tree; final SHA recorded in PR | Auto-deploy and push-trigger regressions | PASS | None |
| Input pack and quote queue remain fail closed | Input pack/frontend focused tests | Remediation working tree; final SHA recorded in PR | Integrity, deterministic checksum, wiring and XSS tests | PASS | Real input pack remains unavailable by design |
| Full backend/frontend regression | Repository test suites | Remediation working tree; final SHA recorded in PR | `npm run test:all` | PASS: backend 640/640 executed, 2 environment-gated skipped; frontend 15/15 | PostgreSQL-gated tests were run separately and passed |
