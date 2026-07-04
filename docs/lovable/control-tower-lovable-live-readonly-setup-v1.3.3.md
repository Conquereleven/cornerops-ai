# Control Tower Lovable Live Read-Only Setup v1.3.3

Use this only after the backend bridge has been configured locally or on a protected host.

## Backend Setup

1. Generate a long local operator token.
2. Generate its hash:

   ```bash
   npm run control-tower:frontend-token-hash
   ```

3. Put only the hash in `.env`:

   ```env
   CONTROL_TOWER_FRONTEND_API_ENABLED=true
   CONTROL_TOWER_FRONTEND_AUTH_REQUIRED=true
   CONTROL_TOWER_FRONTEND_AUTH_MODE=operator_token
   CONTROL_TOWER_FRONTEND_TOKEN_HASH=
   CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS=https://lovable.dev,https://*.lovable.app,http://localhost:3000
   CONTROL_TOWER_FRONTEND_ALLOW_LOCALHOST=true
   CONTROL_TOWER_FRONTEND_READ_ONLY=true
   CONTROL_TOWER_FRONTEND_FAIL_CLOSED=true
   CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS=true
   CONTROL_TOWER_FRONTEND_MASK_PII=true
   ```

4. Start the backend:

   ```bash
   npm start
   ```

5. Check the API:

   ```bash
   npm run control-tower:frontend-api-check
   ```

## Lovable Setup

1. Open the `CornerOps Control Tower` Lovable project.
2. Go to `Settings`.
3. Enter Backend API Base URL.
4. Enter the operator token at runtime.
5. Keep `Mock Mode` enabled until Connection Test succeeds.
6. Click `Connection Test`.
7. Enable `Live Read-Only Mode` only if the test succeeds.
8. Verify these labels remain visible:
   - Read-Only Bridge Active
   - writes blocked
   - external sends blocked
   - source mode
   - audit ID

## Token Storage

Default storage is session-only. The token clears when the tab closes.

`Remember token on this device` is optional and lower security because it stores the runtime token in browser local storage. Use it only on a trusted founder machine.

## Still Disabled

- production writes
- Supabase writes
- Lovable marketplace mutations
- GitHub writes
- WhatsApp sends
- email sends
- customer channels
- proactive outbound
- OpenClaw execution
