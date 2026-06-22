# OpenClaw Gateway Runbook

OpenClaw should run self-hosted, preferably bound to localhost or a private
network.

Expected local base URL:

```env
OPENCLAW_BASE_URL=http://127.0.0.1:18789
```

Health check from CornerOps:

```bash
curl -H "x-internal-api-key: $INTERNAL_API_KEY" \
  http://127.0.0.1:3000/api/openclaw/health
```

Do not expose OpenClaw publicly without network controls, auth and allowlists.
