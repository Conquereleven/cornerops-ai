# OpenClaw Integration

CornerOps AI remains the business brain. OpenClaw is used only as a
self-hosted gateway for channels and controlled tool execution.

Defaults are intentionally conservative:

- `OPENCLAW_ENABLED=false`
- `OPENCLAW_DRY_RUN=true`
- `OPENCLAW_REQUIRE_APPROVAL=true`
- no real channel sends
- no destructive tools

Use `/api/openclaw/health` to verify configuration and
`/api/openclaw/messages` to exercise the dry-run adapter.
