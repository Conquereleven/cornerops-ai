# Workflows

CornerOps Core Agent Pack v0.1 defines five operational workflows. All run in
dry run by default and can operate without OpenClaw.

## Daily Briefing

Trigger examples:

- "Dame mi briefing de hoy"
- "Resumen de pendientes"
- "Prioridades y bloqueos"

Flow:

1. Router detects briefing intent.
2. `daily-briefing-agent` proposes read-only actions.
3. Agent returns prioritized summary.
4. Audit event is written.

No sends, tasks or data changes occur without approval.

## B2B Follow-Up

Trigger examples:

- "Qué leads B2B tengo pendientes"
- "Prepara follow-up para restaurante interesado en Tajín"
- "Prepara respuesta para Jaime"

Flow:

1. Router detects B2B sales intent.
2. `b2b-sales-agent` reads lead context and prepares a draft.
3. Draft remains unsent.
4. Any send/create-task request requires approval.

## Quotes And Orders Review

Trigger examples:

- "Revisa quotes sin seguimiento"
- "Marca esta orden como pagada"
- "Cambia estado de esta orden"

Flow:

1. Router detects quote/order/payment intent.
2. `quotes-orders-agent` reads quote/order context.
3. Read-only summaries return in dry run.
4. Payment or status changes create pending approvals.

## GitHub/Codex Issue Draft

Trigger examples:

- "Crea un issue para este bug"
- "Prepara prompt para Codex"
- "Resume este error de CI"

Flow:

1. Router detects dev intent.
2. `dev-codex-github-agent` drafts issue/PR/prompt content.
3. Creating a real issue, merge or deploy requires approval.
4. Secrets are never requested or exposed.

## Security Audit Review

Trigger examples:

- "Revisa logs de acciones rechazadas"
- "Qué riesgos de configuración ves"
- "Revisa fallos de OpenClaw"

Flow:

1. Router detects security/audit intent.
2. `security-audit-agent` reads audit/config summary only.
3. Findings are classified low, medium, high or critical.
4. Any config change remains a recommendation requiring approval.
