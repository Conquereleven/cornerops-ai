# Daily Operating Loop v1.0

## Morning routine

1. Run `npm run founder:setup-check`.
2. Run `npm run founder:daily`.
3. Open Control Tower and review Founder Beta Readiness, Real Source Expansion v1.1 and CornerMex Lovable Connector v1.1.1.
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

In v1.1, GitHub issues, PRs and workflow runs may come from real read-only GitHub only when the read-only token and feature flags are configured. Otherwise the answer must say `mock`.

In v1.1.1, CornerMex product, lead, quote, order and customer context may come
from the Lovable connector. If Lovable repo/Supabase config is missing, the
answer must say `mock` or `missing_config`; it must not imply production data.

In v1.1.2, `founder:daily` also reports config intake status, repo discovery
status, Supabase read-only status and the next action required to move from
`mock` toward `repo_discovered` or `real_read_only`.

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

## Real source check

```bash
npm run demo:v1.1
npm run demo:v1.1.1
npm run demo:v1.1.2
```

Review the `sourceModeSummary`, GitHub readiness, Business DB readiness and final safety summary before trusting any real-data readout.
For v1.1.1, also review the Lovable project/repo/Supabase status and mapped
contract confidence.

## Shutdown

Stop the local server with `Ctrl+C`. Do not expose the local console through tunnels or public networks.
