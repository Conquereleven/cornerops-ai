# CornerOps Data Model v0.1

CornerOps AI usa modelos canonicos para que los agentes no dependan del shape crudo de Supabase, GitHub u OpenClaw.

## Lead

Representa oportunidades B2B de CornerMex. Estados soportados: `new`, `contacted`, `qualified`, `quoted`, `negotiating`, `won`, `lost`, `stale`, `unknown`. Fuentes: `website`, `whatsapp`, `instagram`, `email`, `manual`, `b2b_outreach`, `marketplace`, `unknown`.

## Quote

Representa cotizaciones B2B. Estados: `draft`, `sent`, `viewed`, `follow_up_needed`, `accepted`, `rejected`, `expired`, `unknown`. Los items se normalizan a `sku`, `name`, `quantity`, `unitPrice`, `total`.

## Order

Representa ordenes y pagos manuales. Estados: `pending`, `confirmed`, `payment_pending`, `paid`, `processing`, `ready_to_ship`, `shipped`, `delivered`, `cancelled`, `refunded`, `unknown`. Metodos de pago: `card`, `bank_transfer`, `cod`, `cash`, `manual`, `unknown`.

## AuditLog

Registra requests de agentes, invocaciones de tools, data reads, proposals, approvals, security denials, webhooks y servicios OpenClaw. Entradas y salidas se sanitizan antes de almacenarse.

## Approval

Representa una accion sensible pendiente de humano: crear issue real, cambiar estado de lead/orden, marcar pago manual, correr Crabox/Lobster, aprobar/deshabilitar skills.

## GitHub

`GitHubIssue`, `GitHubPullRequest` y `GitHubWorkflowRun` son metadata read-only por defecto. `createIssueDraft` no escribe. `createIssue` devuelve `dry_run` o `needs_approval`.

## DataHealthReport

Resume modo actual, fuentes habilitadas, conexion mock/DB, GitHub, servicios OpenClaw, warnings y errores recientes.
