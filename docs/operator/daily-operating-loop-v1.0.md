# Daily Operating Loop v1.0

## Morning routine

1. Run `npm run founder:setup-check`.
2. Run `npm run founder:daily`.
3. Open Control Tower and review Founder Beta Readiness.
4. Confirm dry-run, read-only, external sends blocked and writes blocked.

## B2B follow-up review

Ask: “Qué leads B2B tengo pendientes para seguimiento”.

Use drafts only. Do not send customer/prospect messages from CornerOps in v1.0.

## Quotes/orders review

Ask: “Revisa quotes y órdenes sin seguimiento”.

CornerOps may summarize and propose internal notes/tasks. It must not change quote, order or payment status.

## GitHub/Codex review

Ask: “Dame resumen GitHub y Codex de tareas técnicas”.

GitHub issue drafts are allowed. Real issue creation remains disabled unless a later supervised pilot enables it.

## Security review

Ask: “Revisa eventos de seguridad recientes”.

Review denied actions, rejected channel attempts, approval failures and configuration warnings.

## Approvals review

Use Approval Center or:

```bash
npm run cornerops -- approvals
```

Only execute dry-run approvals in v1.0 daily beta.

## Backup routine

```bash
npm run state:export-summary
npm run state:backup
```

Backups are local, sanitized and stored under `.cornerops/backups`.

## Shutdown

Stop the local server with `Ctrl+C`. Do not expose the local console through tunnels or public networks.
