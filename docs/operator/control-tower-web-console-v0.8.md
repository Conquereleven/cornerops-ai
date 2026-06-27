# Control Tower Web Console v0.8

Control Tower is an internal operator surface. CornerOps remains the brain and source of truth; the browser only reads sanitized reports and submits policy-routed operator questions.

## Enable locally

Set these values only in a private local environment:

```env
CORNEROPS_WEB_CONSOLE_ENABLED=true
CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH=true
CORNEROPS_WEB_CONSOLE_AUTH_TOKEN=<long-random-local-token>
CORNEROPS_WEB_CONSOLE_LOCAL_ONLY=true
CORNEROPS_WEB_CONSOLE_READ_ONLY=true
CORNEROPS_WEB_CONSOLE_DRY_RUN=true
```

Build and serve the integrated app:

```bash
npm run build
npm start
```

Open `http://127.0.0.1:3000/control-tower`, enter the local token, and connect. The token is held in browser session storage and sent only in `x-cornerops-console-token`; it is never returned by the API or embedded with `VITE_*`.

For Vite development, add `http://127.0.0.1:5173` to `CORNEROPS_WEB_CONSOLE_ALLOWED_ORIGINS` and run `npm run dev`.

## Sections

The console shows system/safety posture, Telegram and persistent safeguards, first real source, agents, data/context sources, GitHub, OpenClaw ecosystem, approvals, audit evidence, security risks and Operator Ask.

Source labels mean:

- `mock`: fixture or in-memory evidence, not production truth.
- `read_only` / `real_read_only`: verified read-only source.
- `dry_run`: evaluation occurred without an external action.
- `disabled`: not configured or prohibited.

Operator Ask supports briefing, leads, quotes, orders, GitHub suggestions, security, approvals and status. Every accepted or denied ask is audited. Approval commands must use Approval Center and never execute the proposed action.

## Disable

Set `CORNEROPS_WEB_CONSOLE_ENABLED=false`, restart the backend and verify `GET /api/control-tower/v0.8/status` returns `404`.

Still disabled: production writes, external sends, payments, order status changes, WhatsApp, customer/prospect channels, crawler syncs, native tools and ClawHub execution.

## v0.9 extension

`GET /api/control-tower/v0.9/status` adds the controlled-action allowlist, global/action modes, pending controlled approvals, dry-run/real/blocked counters, idempotency health and last execution. The React console uses this report and keeps the v0.8 endpoints compatible.

Approval Center may execute only checksum-protected controlled approvals in dry-run. Audit Viewer adds the `actions` lifecycle filter. The console does not expose PR merge, workflow, payment, order, lead or quote mutation controls.
