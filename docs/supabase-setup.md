# Supabase Staging Setup

## Objetivo

Activar persistencia real de CornerOps AI en un proyecto Supabase aislado, sin
exponer la service role key ni eliminar el fallback local.

## Configuración

1. Crear un proyecto Supabase exclusivo para CornerOps AI.
2. Abrir SQL Editor y ejecutar `supabase/schema.sql`.
3. Ejecutar `supabase/seed.sql` solo en staging o desarrollo.
4. Configurar en `.env`:

```env
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
USE_SUPABASE=true
AI_WORKERS_MODE=hybrid
```

5. Reiniciar el backend.
6. Consultar `GET /api/health`; `dataSource.mode` debe ser `supabase`.

## Clientes

- `getSupabaseClient()` usa exclusivamente la anon key.
- `getSupabaseAdminClient()` usa la service role key y solo existe en backend.
- Los repositories usan admin cuando está disponible y anon como fallback.
- En `NODE_ENV=test`, ambos clientes permanecen deshabilitados.

## Migración Sprint 5 a Sprint 6

El SQL es aditivo. Conserva columnas y tablas legacy, crea
`conversation_messages`, copia mensajes existentes y añade `worker_events`.
El repository detecta automáticamente `conversation_messages` o `messages`.

Antes de producción:

- Respaldar la base.
- Ejecutar el SQL en staging.
- Verificar conversaciones, mensajes, leads, productos y órdenes.
- Confirmar políticas RLS y roles.
- Probar idempotencia con el mismo `requestId`.

## Seguridad

- Nunca incluir `SUPABASE_SERVICE_ROLE_KEY` en variables `VITE_*`.
- No enviar claves a OpenAI, logs, respuestas HTTP o webhooks.
- Mantener `.env` fuera de Git.
- Rotar claves si aparecen en un terminal compartido o artefacto publicado.
- Añadir políticas RLS antes de permitir acceso directo desde un cliente web.

## Fallback

Si faltan credenciales o una consulta falla, los repositories regresan a
memoria/mocks cuando la operación es segura. El campo `source` de `/api/chat`
indica `supabase` o `memory`.
