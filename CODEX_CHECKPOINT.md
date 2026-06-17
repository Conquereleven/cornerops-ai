# CODEX Checkpoint - Sprint 6

Fecha: 2026-06-17

## Estado encontrado

- Sprint 4 y 5 estaban funcionales y comprometidos en `d295c46`.
- Supabase real ya estaba activo en un entorno independiente.
- Existían repositories híbridos, memoria, leads, órdenes, catálogo, dashboard,
  API interna, esquema SQL y 57 pruebas backend.
- Faltaban idempotencia, `source`, clientes anon/admin separados, eventos,
  customer repository, operaciones internas completas y WhatsApp adapter.

## Implementado

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

## Fallback

- Sin Supabase: conversaciones y eventos en memoria; catálogo, órdenes, leads y
  clientes usan mocks.
- Sin OpenAI: templates deterministas.
- Sin WhatsApp: webhook placeholder, sin llamadas externas.

## Verificación

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

- `INTERNAL_API_KEY` sigue siendo una protección inicial, no RBAC.
- La sincronización de mocks es solo para staging.
- La migración SQL debe probarse y respaldarse antes de producción.
- En el staging actual, `worker_events` requiere ejecutar `supabase/schema.sql`
  para persistir eventos remotos; mientras tanto el fallback en memoria opera.
- El webhook aún no valida firma HMAC ni envía respuestas a Meta.
- RAG sigue usando keywords, sin embeddings.
- El checkout local no tiene `git remote`, por lo que no se puede empujar ni
  abrir PR hasta configurar el repositorio GitHub de destino.

## Sprint 7 recomendado

- Migraciones versionadas y pipeline CI/CD para staging.
- RBAC administrativo y auditoría.
- Firma y envío real de WhatsApp Business.
- Cola de trabajos y reintentos.
- Catálogo/inventario real sincronizado.
- RAG híbrido con pgvector y evaluaciones.
- Analytics de calidad, conversión, costo y latencia.
