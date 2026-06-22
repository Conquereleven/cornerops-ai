# Control Tower Web v0.8 Runbook

## Run

```bash
npm run qa
npm run build
npm start
```

With the private local flags from `docs/operator/control-tower-web-console-v0.8.md`, open `http://127.0.0.1:3000/control-tower`.

Static fallback:

```bash
npm run control:tower:web-report
```

Open `.cornerops/reports/control-tower-v0.8.html`. It is local, mode `0600`, read-only and contains no interactive action controls.

## Demos

```bash
npm run demo:control-tower-web
npm run demo:approval-center
npm run demo:audit-viewer
npm run demo:v0.8
```

All run without real credentials.

## Troubleshoot

- `404`: console feature flag is off.
- `401`: token is missing or invalid.
- `503 authentication is not configured`: auth is required but token is empty.
- `403 local-only`: request did not originate from loopback.
- `403 origin`: add only the exact trusted local origin.
- `503 safety configuration`: read-only, dry-run or fail-closed is unsafe.

## Verify safety

Run `npm run demo:v0.8`, inspect `safety.writesBlocked=true`, `externalSendsBlocked=true`, and confirm approval results include `executed=false`. Run the secret scan from the acceptance document. No order, payment, lead, quote or outbound-message endpoint is part of v0.8.

Disable with `CORNEROPS_WEB_CONSOLE_ENABLED=false` and restart.
