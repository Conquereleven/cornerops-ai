# Railway Environment v1.3.5

## Purpose

Railway runs the CornerOps backend as the hosted API for the Lovable Control Tower frontend.

## Required Railway Variables

Use hash-based operator token auth only. Do not store raw operator tokens in docs, commits, PR descriptions, screenshots, or chat.

```env
NODE_ENV=production
CORNEROPS_BIND_HOST=0.0.0.0

CONTROL_TOWER_FRONTEND_API_ENABLED=true
CONTROL_TOWER_FRONTEND_AUTH_REQUIRED=true
CONTROL_TOWER_FRONTEND_AUTH_MODE=operator_token
CONTROL_TOWER_FRONTEND_TOKEN_HASH=<sha256 hash only>
CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS=https://lovable.dev,https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app
CONTROL_TOWER_FRONTEND_ALLOW_LOCALHOST=false
CONTROL_TOWER_FRONTEND_READ_ONLY=true
CONTROL_TOWER_FRONTEND_FAIL_CLOSED=true
CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS=true
CONTROL_TOWER_FRONTEND_MASK_PII=true
CONTROL_TOWER_FRONTEND_RATE_LIMIT_PER_MINUTE=60
CONTROL_TOWER_FRONTEND_MAX_PAYLOAD_KB=256
CONTROL_TOWER_FRONTEND_REQUEST_TIMEOUT_MS=8000

CORNERMEX_SUPABASE_ALLOW_WRITES=false
OPENCLAW_ENABLED=false
CLWHUB_EXECUTION_ENABLED=false
WHATSAPP_SENDS_ENABLED=false
EMAIL_SENDS_ENABLED=false
CUSTOMER_CHANNELS_ENABLED=false
PROACTIVE_OUTBOUND_ENABLED=false
GITHUB_WRITES_ENABLED=false
LOVABLE_MUTATIONS_ENABLED=false
```

## Explicitly Forbidden

Do not configure:

- Raw operator token as an env var
- Telegram bot token in Lovable
- Supabase service role key
- GitHub write token
- WhatsApp send credentials
- Email send credentials

## Rotation

To rotate the Control Tower operator token:

1. Generate a new local token and hash.
2. Store only the hash in Railway.
3. Store the raw token only in a local ignored file or password manager.
4. Redeploy Railway.
5. Update the Lovable browser session with the new raw token only when testing.

