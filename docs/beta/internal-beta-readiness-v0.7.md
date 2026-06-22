# Internal Beta Readiness v0.7

- [x] Persistent replay protection survives restart tests.
- [x] Rejections and rate-limit state persist with sanitized content.
- [x] Unknown users/chats, groups, duplicates and excessive traffic are blocked before routing.
- [x] Telegram webhook and same-chat reply path are implemented and disabled by default.
- [x] Mock demos run without real credentials or sends.
- [x] First-source selector prefers verified business DB, then GitHub, then mock.
- [x] Business DB and GitHub write paths remain blocked.
- [x] Control Tower shows Telegram security and source readiness.
- [x] PII masking, audit IDs, source and approval labels remain active.
- [ ] Founder Telegram credentials and one-user/chat allowlist approved.
- [ ] HTTPS dry-run webhook observed in the target environment.
- [ ] First real read-only credential approved and connected.
- [ ] Shared transactional stores before horizontal scaling.

Release decision: code-ready for one-founder Telegram dry-run activation; current environment remains mock because credentials are absent.
