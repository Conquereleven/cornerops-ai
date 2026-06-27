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

## v1.0 founder readiness

`GET /api/control-tower/v1.0/status` wraps the v0.9 report with
`founderBetaReadiness`. The React console now shows:

- setup check status
- local env status
- persistence and backup status
- auth/local-only status
- controlled actions status
- GitHub real issue creation status
- Telegram real mode status
- external sends and writes status
- last backup

The visual release gate for v1.0 is documented in
`docs/acceptance/visual-acceptance-v1.0.md`.

## v1.1 real source expansion

`GET /api/control-tower/v1.1/status` wraps the v1.0 report with
`realSourceExpansion`. The React console uses this report and shows:

- selected source and source mode summary
- GitHub read-only status, credential presence and write blocking
- Business DB/Supabase read-only readiness, PII masking and schema discovery
- agent real-data usage status
- blocked write flags
- source warnings

The console never returns GitHub tokens, database URLs or Supabase keys. Real
source labels must remain explicit: `mock`, `real_read_only`, `mixed`,
`disabled`, `local_internal` or `dry_run`.

## v1.1.1 Lovable CornerMex connector

The same v1.1 endpoint now includes `cornerMexLovableConnector`. The React
console shows:

- enabled/disabled and discovery mode
- source mode: `mock`, `repo_discovered`, `real_read_only` or missing config
- Lovable project, connected GitHub repo and Supabase configuration status
- discovered entities and flows
- mapped CornerMex contracts and confidence
- PII masking and write-blocking status
- last read/audit status
- warnings and founder next steps

The console never scrapes Lovable, mutates the Lovable project, exposes
Supabase keys or enables CornerMex writes.

## v1.1.2 real config readiness

The `cornerMexLovableConnector` section now also shows:

- config intake status
- project/repo/deployment/Supabase completeness
- current mode and candidate progression
- missing founder config
- write-risk paths found/documented by repo discovery
- exact next recommended action

Modes remain explicit: `missing_config`, `mock`, `repo_discovered` and
`real_read_only`. The console does not print Supabase keys.
