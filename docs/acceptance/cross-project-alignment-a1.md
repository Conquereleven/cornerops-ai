# Cross-Project Alignment A1 Acceptance

- Active CornerMex source: `ywyiejqnbyzjfatojvkh`, identified from repository and live deployment evidence.
- Candidate target: `wlrfknmrhowldygmvtvn`; public schema, storage and migration history were empty before the security-only grant remediation.
- Candidate security: `public.rls_auto_enable()` client execution revoked; post-migration security and performance advisors have no findings.
- CornerOps read source: limited external read replica in `nhxpujypqxbjiqqddxqt`; nine product rows currently readable.
- Shared contract: `cornermex-cornerops-boundary-v1`; checksum matches both repositories.
- Commerce model: single merchant with internal supplier network.
- CornerOps writes to CornerMex: blocked.
- Customer PII: CornerMex-owned; only masked references or aggregates may cross the boundary.
- Historical stock 50: unsafe legacy fixture, not authoritative.
- CornerOps planning stock: 48,900 planning units, zero physically verified products.
- Future command bridge: not implemented.
- Marketing Intelligence v1.16: deferred.
- Lovable, OpenClaw and external actions: zero calls.

Rollback is a PR revert for code/docs. Security grants must never be restored to `PUBLIC`, `anon` or `authenticated`; any rollback may restore execution only to a reviewed administrative role.
