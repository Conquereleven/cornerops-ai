# CornerOps Operator Quickstart v0.5

## Install and validate

```bash
npm install
npm --prefix frontend install
npm run qa
npm run demo:interactive-beta
```

Do not create a secret-bearing `.env` from production values for the mock beta. Safe defaults already keep operator actions read-only and dry-run.

## Start using CornerOps

```bash
npm run cornerops -- help
npm run cornerops -- briefing
npm run cornerops -- ask "Which B2B leads need follow-up?"
npm run cornerops -- ask "Prepare a follow-up draft for restaurants interested in Tajin and Pulparindo"
npm run cornerops -- control
npm run cornerops -- approvals
npm run cornerops -- audit
```

Run `npm run cornerops` without arguments for an interactive in-process session. Type `exit` to stop it.

## Read the output

- `mock`: fixtures or in-memory data, never production truth.
- `read_only`: a verified read-only source supplied the facts.
- `mixed`: both mock and read-only sources contributed.
- `disabled`: the requested source/action is unavailable.
- `Requires Approval` describes the proposal; approval never implies execution in v0.5.
- `auditId` links the request to sanitized audit logs.

Missing data appears as a warning. CornerOps must not fill gaps with invented metrics.

## Approvals and audit

```bash
npm run cornerops -- approvals
npm run cornerops -- approvals approve approval-...
npm run cornerops -- approvals reject approval-...
npm run cornerops -- audit
npm run cornerops -- audit denied
npm run cornerops -- audit errors
```

Approval changes are in-memory simulations. They never execute the proposed write or send.

## Demos and shutdown

Use `npm run demo:interactive-beta`, `npm run demo:beta` and `npm run demo:control-tower`. Stop an interactive CLI with `exit` or `Ctrl+C`; stop the dev server with `Ctrl+C`. Set `CORNEROPS_OPERATOR_INTERFACE_ENABLED=false` or `CORNEROPS_CLI_ENABLED=false` to disable the interface.

Safety limits: no production writes, external sends, real channel syncs, crawlers, native host tools, external skill installation or deploys.

## Operator channel v0.6

The CLI remains the fallback. Test the chat-shaped path without credentials:

```bash
npm run demo:operator-channel
npm run demo:real-operator-channel
```

The first command uses an allowlisted mock founder. The second only checks
whether Telegram configuration is present and never sends. Real Telegram setup
is documented in `docs/runbooks/operator-channel-setup.md`; do not enable
WhatsApp, Slack events, groups or customer channels in v0.6.
