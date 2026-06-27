# Release Notes v1.0 Founder Beta

## Usable now

- Control Tower v1.0 with Founder Beta Readiness.
- Operator Ask for daily internal questions.
- Approval Center and Audit Viewer.
- Security Dashboard.
- Controlled actions in dry-run.
- GitHub issue drafts.
- Local internal note/task proposals.
- Local state backup and sanitized export summary.
- Founder setup check and daily operating loop.

## Run locally

```bash
cp .env.founder.local.example .env
npm run founder:setup-check
npm run founder:daily
npm start
```

## Disabled by default

Real GitHub issue creation, customer sends, WhatsApp, Slack sends, external email, payment/order/lead/quote mutations, native tools, ClawHub execution, deploys and production DB writes.

## Rollback

Stop the server, keep `.cornerops/state`, run `npm run state:backup`, then switch back to the previous release branch or commit.

## Known limitations

- File JSON is single-process local beta storage.
- Web auth is a single local token.
- Visual acceptance uses deterministic local/API/build checks because embedded browser QA is unavailable.

## Next sprint

`CornerOps Real Source Expansion v1.1`.
