# Rollback Runbook

Fast rollback options:

1. Set `OPENCLAW_ENABLED=false`.
2. Keep `OPENCLAW_DRY_RUN=true`.
3. Remove risky channels from `OPENCLAW_ALLOWED_CHANNELS`.
4. Remove risky tools from `OPENCLAW_ALLOWED_TOOLS`.
5. Restart the backend.

No production migration is required for the OpenClaw foundation.
