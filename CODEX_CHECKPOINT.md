# CODEX Checkpoint - Sprint 8 Core Agent Pack v0.1

Fecha: 2026-06-18

## Estado encontrado

- El repositorio privado fue renombrado de `Conquereleven/cornerops-ai-workers`
  a `Conquereleven/cornerops-ai` conservando historial.
- `origin` local apunta a `https://github.com/Conquereleven/cornerops-ai.git`.
- Se creó `develop` desde `main` y la implementación vive en
  `feature/openclaw-integration`.
- La fase Core Agent Pack v0.1 vive en `feature/core-agent-pack-v0.1` y parte
  de la base OpenClaw porque `main` aún no contiene el PR del foundation.
- Sprint 4 y 5 estaban funcionales y comprometidos en `d295c46`.
- Supabase real ya estaba activo en un entorno independiente.
- Existían repositories híbridos, memoria, leads, órdenes, catálogo, dashboard,
  API interna, esquema SQL y 57 pruebas backend.
- Faltaban idempotencia, `source`, clientes anon/admin separados, eventos,
  customer repository, operaciones internas completas y WhatsApp adapter.

## Implementado

- Base de integración OpenClaw en `src/integrations/openclaw/` con cliente,
  adapter, router de canales, políticas, aprobaciones humanas, auditoría y
  puente de memoria.
- OpenClaw queda apagado por defecto con `OPENCLAW_ENABLED=false` y en dry run
  con `OPENCLAW_DRY_RUN=true`.
- Cliente OpenClaw usa `fetch` nativo con timeout, retry solo idempotente,
  circuit breaker básico, request IDs y headers configurables.
- Endpoints internos protegidos para health, mensajes, aprobaciones y audit log.
- Políticas iniciales: lectura permitida, drafts sin envío, acciones sensibles
  con aprobación humana y acciones destructivas prohibidas.
- Documentación nueva en `docs/architecture`, `docs/security`, `docs/runbooks`,
  `docs/openclaw-integration` y `docs/sprints/ia-en-mexico.md`.
- README actualizado: CornerOps AI es el sistema operativo interno; OpenClaw es
  gateway self-hosted multicanal/capa de ejecución controlada.
- CI en `.github/workflows/ci.yml` para install, lint, typecheck, test y build.
- Configuración centralizada para variables `OPENCLAW_*`, canales permitidos,
  auditoría, approvals, dry run y sandbox.
- Core Agent Pack v0.1 en `src/core` con AgentRegistry, AgentOrchestrator,
  AgentPermissionPolicy, WorkflowRegistry, AgentMemoryService y
  AgentAuditService.
- Seis agentes internos: `cornerops-router-agent`, `daily-briefing-agent`,
  `b2b-sales-agent`, `quotes-orders-agent`, `dev-codex-github-agent` y
  `security-audit-agent`.
- Prompts base por agente en `src/core/agents/prompts`.
- Routing determinístico por intención para briefing, B2B, quotes/orders,
  GitHub/Codex y seguridad/auditoría.
- `POST /api/openclaw/messages` mantiene el resultado legacy OpenClaw y agrega
  `agentResult` del Core Agent Pack.
- Demo local `npm run demo:agents`, siempre en dry run.
- Variables `CORNEROPS_*` agregadas con dry run y approvals activos por defecto.
- Configuración centralizada para lenguaje, modo de workers, seguridad interna,
  Supabase y futuras variables WhatsApp.
- Clientes Supabase normal y admin con helpers públicos.
- SQL staging aditivo en `supabase/schema.sql`.
- Compatibilidad automática entre `conversation_messages` y `messages`.
- Idempotencia de `/api/chat` mediante `requestId`.
- Campo `source` en respuestas: `supabase` o `memory`.
- Persistencia de eventos en `worker_events` con fallback local.
- Customer repository híbrido.
- Estados B2B validados, notas y captura limitada a tres preguntas prioritarias.
- Catálogo interno con búsqueda, upsert y sincronización protegida de staging.
- Detalle interno de órdenes.
- Webhook WhatsApp placeholder y adapter de entrada/salida.
- AI response service con contexto limitado y hechos verificados.
- Compatibilidad PostgREST `PGRST205` para usar la tabla legacy `messages`
  cuando `conversation_messages` aún no se ha migrado en staging.

## Endpoints Sprint 6

- `GET /api/internal/products/search`
- `POST /api/internal/products/sync-mocks`
- `GET /api/internal/orders/:orderNumber`
- `POST /api/internal/leads/:leadId/notes`
- `GET/POST /api/internal/customers`
- `GET /api/internal/worker-events`
- `GET/POST /api/webhooks/whatsapp`

## Endpoints OpenClaw Foundation

- `GET /api/openclaw/health`
- `POST /api/openclaw/messages`
- `GET /api/openclaw/approvals`
- `POST /api/openclaw/approvals`
- `GET /api/openclaw/approvals/:id`
- `POST /api/openclaw/approvals/:id/approve`
- `POST /api/openclaw/approvals/:id/reject`
- `GET /api/openclaw/audit-logs`

## Fallback

- Sin Supabase: conversaciones y eventos en memoria; catálogo, órdenes, leads y
  clientes usan mocks.
- Sin OpenAI: templates deterministas.
- Sin WhatsApp: webhook placeholder, sin llamadas externas.
- Sin OpenClaw: agentes operan localmente en dry run sin invocar servicios
  externos.

## Verificación

- Backend: 34 suites, 96 pruebas aprobadas.
- Frontend: 3 suites, 5 pruebas aprobadas.
- Core Agent Pack focalizado: 5 suites, 15 pruebas aprobadas dentro del total.
- Demo `npm run demo:agents` aprobada en dry run.
- Lint sintáctico: 118 archivos JavaScript aprobados con `scripts/check-syntax.js`.
- Typecheck frontend: `tsc --noEmit` aprobado.
- Build frontend: Vite production build generado correctamente.
- Backend Sprint 6: 24 suites, 66 pruebas aprobadas.
- Frontend: 3 suites, 5 pruebas aprobadas.
- Build frontend: Vite production build generado correctamente.
- Validación real con Supabase staging:
  - `GET /api/health` reportó `mode=supabase`, `configured=true`,
    `credentialType=service_role`.
  - `/api/chat` guardó conversación y mensajes con `source=supabase`.
  - Reintento con el mismo `requestId` regresó `idempotentReplay=true` sin
    duplicar mensajes.
  - `/api/internal/worker-events` respondió 200 usando fallback local cuando
    `worker_events` aún no existe en la base.
- Dashboard verificado en Chrome: data layer Supabase, métricas visibles,
  responsive desktop y sin errores de consola.
- Tests sin OpenAI, Supabase ni WhatsApp externos.

## Riesgos

- La integración OpenClaw aún no conecta canales reales ni herramientas reales.
- Las aprobaciones y auditoría están en memoria para esta fase; requieren
  persistencia antes de producción.
- La auditoría/memoria específica de agentes está en memoria para v0.1.
- El routing de v0.1 es determinístico por keywords; requiere evaluaciones y
  posible router model-backed antes de producción a escala.
- `feature/core-agent-pack-v0.1` está apilada sobre
  `feature/openclaw-integration` hasta que el foundation sea mergeado.
- Los contratos concretos de una instalación OpenClaw real siguen marcados como
  supuestos en `docs/openclaw-integration/assumptions.md`.
- `INTERNAL_API_KEY` sigue siendo una protección inicial, no RBAC.
- La sincronización de mocks es solo para staging.
- La migración SQL debe probarse y respaldarse antes de producción.
- En el staging actual, `worker_events` requiere ejecutar `supabase/schema.sql`
  para persistir eventos remotos; mientras tanto el fallback en memoria opera.
- El webhook aún no valida firma HMAC ni envía respuestas a Meta.
- RAG sigue usando keywords, sin embeddings.

## Sprint 9 recomendado

- Migraciones versionadas y pipeline CI/CD para staging.
- RBAC administrativo y auditoría.
- Persistencia Supabase para aprobaciones y audit log OpenClaw.
- Persistencia Supabase para `agent_audit` y memoria operativa de agentes.
- UI de approvals y agente seleccionado en el Command Center.
- Validar contrato real de OpenClaw gateway antes de activar `OPENCLAW_ENABLED`.
- Firma y envío real de WhatsApp Business.
- Cola de trabajos y reintentos.
- Catálogo/inventario real sincronizado.
- RAG híbrido con pgvector y evaluaciones.
- Analytics de calidad, conversión, costo y latencia.
