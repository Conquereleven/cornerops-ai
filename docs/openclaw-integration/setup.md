# OpenClaw Setup

Requirements:

- Node 24 recommended, Node 22.19+ minimum for OpenClaw.
- OpenClaw gateway running on a trusted local or private host.
- CornerOps backend running separately.

Configure:

```env
OPENCLAW_ENABLED=false
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=
OPENCLAW_GATEWAY_PASSWORD=
OPENCLAW_DRY_RUN=true
OPENCLAW_REQUIRE_APPROVAL=true
```

Check status:

```bash
curl -H "x-internal-api-key: $INTERNAL_API_KEY" \
  http://127.0.0.1:3000/api/openclaw/health
```

Enable only in a controlled environment and keep dry run on until approvals,
allowlists and audit have been reviewed.
