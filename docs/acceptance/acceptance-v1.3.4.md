# Acceptance v1.3.4

Sprint: `CornerOps Control Tower Live Bridge Activation v1.3.4`

Branch: `feature/control-tower-live-bridge-activation-v1.3.4`

## Merge Gate

PR #34 was verified open, clean, not draft, and CI green, then merged into `main`.

Latest main commit after merge:

```txt
6ba8963146f0a2fb7bc793cccc6aa8896b47292e
```

## Backend Bridge

Verified local backend bridge with a generated local operator token and hash-only backend configuration.

Runtime results:

```txt
missing token: 401
invalid token: 403
valid token: 200
OPTIONS preflight: 204
disallowed origin: 403
```

Safety properties:

- no raw token printed in acceptance docs
- no raw token committed
- JSON responses include `auditId`
- `writesBlocked=true`
- `externalSendsBlocked=true`
- valid token response returns `sourceMode=repo_discovered`
- invalid/missing token responses fail closed

## Lovable Bridge Attempt

Lovable project:

```txt
https://lovable.dev/projects/de6bc54c-b2d7-4527-b464-adf97760ec25
```

Settings `Connection Test` was attempted with:

```txt
http://127.0.0.1:3210
http://localhost:3210
```

Observed result:

```txt
Network Unreachable: Failed to fetch
```

Conclusion: backend auth and CORS behavior passed locally, but Lovable preview could not reach the local HTTP backend directly. No local tunnel tool was available, so live Lovable-to-backend 200 remains pending a tunnel or protected staging URL.

The Lovable operator token field was cleared after testing and verified empty.

## Tests Run

```bash
npm test -- controlTowerLiveBridgeV134.test.js controlTowerFrontendBridgeV133.test.js
npm run lint
```

Result:

```txt
2 suites passed
10 tests passed
Syntax check passed for 491 JavaScript files.
```

## Acceptance Status

Completed:

- PR #34 merged before v1.3.4 work
- token hash flow supports local generated runtime token
- raw token not committed
- local backend status matrix passes
- Lovable Connection Test attempted against real backend URL
- Lovable blocker documented exactly
- mock fallback remains active
- docs updated

Pending external reachability:

- protected tunnel or hosted staging backend URL
- final Lovable `Live Backend Connected` / `Read-Only Bridge Active` state

## What Remains Disabled

- production writes
- Supabase writes
- Supabase service role usage
- Lovable marketplace mutations
- GitHub writes
- WhatsApp sends
- email sends
- customer channels
- proactive outbound
- OpenClaw execution

## Founder Next Commands

Generate a local runtime token and hash:

```bash
npm run control-tower:frontend-token-hash -- --generate
```

Start backend with the generated hash:

```bash
CONTROL_TOWER_FRONTEND_API_ENABLED=true \
CONTROL_TOWER_FRONTEND_AUTH_REQUIRED=true \
CONTROL_TOWER_FRONTEND_AUTH_MODE=operator_token \
CONTROL_TOWER_FRONTEND_TOKEN_HASH=<generated_hash_only> \
CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS=<lovable_origin> \
npm start
```

Then expose the backend through a protected tunnel or staging URL and run the Lovable Settings `Connection Test`.
