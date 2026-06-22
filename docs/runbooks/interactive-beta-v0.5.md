# Interactive Beta Runbook v0.5

## Start

1. Keep operator, CornerOps and OpenClaw dry-run/read-only defaults.
2. Run `npm run qa` and `npm run demo:interactive-beta`.
3. Run `npm run cornerops -- control`; require `writesBlocked=true` and `externalSendsBlocked=true`.
4. Start `npm run cornerops` for an interactive local session.

## Verify safety

```env
CORNEROPS_OPERATOR_DRY_RUN=true
CORNEROPS_OPERATOR_READ_ONLY=true
CORNEROPS_OPERATOR_REQUIRE_APPROVAL=true
CORNEROPS_DB_ALLOW_WRITES=false
CORNEROPS_API_ENABLED=false
CORNEROPS_WEB_UI_ENABLED=false
OPENCLAW_ENABLED=false
OPENCLAW_OPERATOR_CHANNEL_ENABLED=false
```

Also keep GitHub write flags, crawlers, native tools, channel archives and ClawHub execution disabled.

## Troubleshoot

- `OPERATOR_DISABLED`: enable only `CORNEROPS_OPERATOR_INTERFACE_ENABLED` in a trusted local runtime.
- `OPERATOR_CHANNEL_DENIED`: use CLI; OpenClaw is intentionally not allowlisted.
- `OPERATOR_SAFE_MODE_REQUIRED`: restore dry-run and read-only.
- Missing source warnings: verify Control Tower; do not treat zeros as real-world facts.
- No approvals: create a proposal through an approval-required agent request in the same process/session.
- API returns 404: expected while `CORNEROPS_API_ENABLED=false`.

## Stop or disable

Exit the CLI, stop Node processes and set `CORNEROPS_OPERATOR_INTERFACE_ENABLED=false`. To disable only CLI, set `CORNEROPS_CLI_ENABLED=false`. No database rollback is needed because v0.5 performs no production writes or migrations.
