# OpenClaw Security

- Keep OpenClaw private; do not expose the gateway publicly.
- Use token/password auth when `OPENCLAW_ENABLED=true`.
- Use `OPENCLAW_ALLOWED_CHANNELS`, `OPENCLAW_ALLOWED_USERS` and
  `OPENCLAW_ALLOWED_TOOLS`.
- Keep `OPENCLAW_DRY_RUN=true` until real channel behavior is approved.
- Require human approval for sends, writes, PRs, scripts and deploys.
- Treat unknown tools/actions as requiring confirmation.
- Forbidden actions include destructive commands, payments, refunds and secret
  exposure.
- Audit records sanitize token/password/secret/key fields.
