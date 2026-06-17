# OpenClaw Runbook

## Diagnose Gateway Issues

1. Check `/api/openclaw/health`.
2. Confirm `OPENCLAW_BASE_URL`.
3. Confirm OpenClaw is listening locally.
4. Check token/password configuration.
5. Keep dry run enabled while debugging.

## Emergency Off Switch

Set:

```env
OPENCLAW_ENABLED=false
OPENCLAW_DRY_RUN=true
```

Restart the backend.

## Duplicates

Use `requestId`, channel message ID or provider message ID as idempotency key.

## Token Rotation

Rotate the gateway token in the secret manager, update runtime env and restart.
Never commit the old or new token.
