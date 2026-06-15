# CODEX Checkpoint - Sprint 4 + 5

Fecha: 2026-06-15

## Qué existía

- Orquestador con routing, workers y fallback sin OpenAI.
- Repositories híbridos para Supabase y mocks.
- Persistencia de conversaciones, mensajes, leads y worker runs.
- Catálogo, órdenes, dashboard operativo y frontend responsive.
- Esquema Supabase de ocho tablas y seed idempotente.
- 42 pruebas backend y 5 frontend.

## Qué se completó

- Routing bilingüe con prioridad B2B, categoría canónica y `unknown`.
- Memoria estructurada por conversación y `memorySummary` en `/api/chat`.
- Continuidad contextual para órdenes, catálogo y B2B.
- Búsqueda de órdenes por número o email.
- Calificación B2B progresiva con campos comerciales completos.
- Servicio AI con hechos verificados, guardrails y fallback ante fallos.
- Aliases contractuales de repositories para Sprint 4-5.
- `/api/health`, endpoints mock y endpoints internos protegibles.
- Fallback seguro cuando una operación Supabase falla.
- Placeholder de catálogo para RAG futuro.
- Catálogo mock mínimo ampliado con Piñatas, Tomatillo y Chamoy.

## Archivos principales

- `src/services/agent.js`
- `src/services/memoryService.js`
- `src/services/aiResponseService.js`
- `src/services/catalogSearchService.js`
- `src/services/workers/*`
- `src/data/repositories/*`
- `src/routes/internal.js`
- `src/middleware/internalApiKey.js`
- `src/data/supabase/schema.sql`
- `src/data/supabase/seed.sql`
- `docs/rag-roadmap.md`
- `README.md`
- `tests/*`

## Riesgos y pendientes

- La API key interna es una protección inicial, no sustituye auth con roles.
- WhatsApp, voz, catálogo productivo y RAG real siguen fuera de alcance.
- Las nuevas columnas SQL deben aplicarse en cada ambiente antes de usarlas
  directamente; el código mantiene compatibilidad con el esquema anterior.
- Repositorio Git inicializado y entrega preparada como commit reproducible.

## Verificación ejecutada

- Backend: 20 suites, 57 pruebas aprobadas.
- Frontend: 3 archivos, 5 pruebas aprobadas.
- Build Vite de producción aprobado.
- Health real confirmado en modo Supabase.
- Memoria real confirmada en una conversación de dos turnos.
- API interna confirmada con rechazo sin clave y acceso con clave local.

## Sprint 6 recomendado

- Staging aislado con migraciones versionadas.
- Auth administrativa y RBAC.
- Catálogo real y sincronización de inventario.
- WhatsApp Business API.
- Pipeline de voz con transcripción y TTS.
- RAG híbrido con evaluaciones.
- Analytics de calidad, costo, latencia y conversión.
