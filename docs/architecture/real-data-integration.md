# Real Data Integration v0.1

CornerOps AI sigue siendo el cerebro, fuente de verdad, memoria de negocio, politica y auditoria. OpenClaw y sus servicios son capabilities controladas.

## Estado Actual

- Stack: JavaScript, Express, Jest.
- Modo por defecto: `CORNEROPS_DATA_MODE=mock`, `CORNEROPS_DRY_RUN=true`.
- No hay credenciales reales ni escrituras reales configuradas.
- `MockDataAdapter` carga fixtures realistas sin PII real.
- Supabase/Postgres quedan como adapters seguros/documentados para una migracion posterior.

## Flujo

```mermaid
flowchart TD
  A["AgentOrchestrator"] --> B["Agent tools"]
  B --> C["DataAccessPolicy"]
  C --> D["Domain services"]
  D --> E["Repositories"]
  E --> F["MockDataAdapter / future DB adapter"]
  D --> G["AuditLogService"]
```

## Fuentes

Leads, quotes, orders, GitHub, audit logs, approvals, agent logs y sync status se registran en `DataSourceRegistry`. Cualquier write/proposal sensible requiere approval.

## OpenClaw Coexistence

```mermaid
flowchart TD
  CH["WhatsApp/Telegram/Slack/Web"] --> OC["OpenClaw gateway optional"]
  OC --> CO["CornerOps AI"]
  CO --> POL["Policies + approvals"]
  CO --> DATA["CornerOps data layer"]
  CO --> ECO["OpenClaw ecosystem adapters"]
  ECO --> AUD["Audit logs"]
```

## Supuestos

- Los fixtures son mock, no datos reales.
- DB real y GitHub real requieren flags, credenciales y revision de seguridad.
- Ningun servicio OpenClaw puede operar como source of truth.
