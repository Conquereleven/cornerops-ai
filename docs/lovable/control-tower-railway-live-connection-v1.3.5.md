# Control Tower Railway Live Connection v1.3.5

## Lovable Project

- Project: `CornerOps Control Tower`
- Project URL: `https://lovable.dev/projects/de6bc54c-b2d7-4527-b464-adf97760ec25`
- Preview origin used for CORS: `https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app`

## Backend

- Railway backend URL: `https://cornerops-ai-production.up.railway.app`
- Contract root: `/api/control-tower/frontend/v1`
- Connection test: `/api/control-tower/frontend/v1/connection-test`

## Verified Result

Settings > Backend Bridge v1.3.3 was tested in Live Read-Only Mode.

Result shown in Lovable:

```txt
Live Backend Connected - Read-Only Bridge Active.
```

The operator token was entered only in the browser session for the test and cleared after verification.

## Current Data Mode

The hosted backend currently reports `sourceMode=mock` because Railway is not configured with real CornerMex Supabase read-only credentials.

This is expected. The bridge is live; real CornerMex data remains pending:

- `CORNERMEX_SUPABASE_ENABLED=true`
- `CORNERMEX_SUPABASE_URL`
- `CORNERMEX_SUPABASE_ANON_KEY`

## What Lovable May Do

The Lovable frontend may:

- Call read-only Control Tower API endpoints.
- Show source mode labels.
- Show audit IDs.
- Show disabled actions and approval states.
- Fall back to mock mode if backend auth/config fails.

The Lovable frontend must not:

- Store service credentials.
- Store Supabase service role keys.
- Send WhatsApp messages.
- Send emails.
- Mutate CornerMex, Supabase, GitHub, or Lovable marketplace data.
- Execute OpenClaw actions.

