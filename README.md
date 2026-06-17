# CórnerOps AI Workers

Command Center y backend de AI Workers 24/7 para Cornermex UAE. Atiende
soporte, ventas retail, órdenes y captación B2B en español o inglés. Opera con
Supabase real o fallbacks deterministas, sin depender de OpenAI para responder.

## Estado Sprint 6

- Orquestador ES/EN con workers de soporte, ventas, órdenes, B2B y handoff.
- Memoria conversacional, extracción de entidades e idempotencia por
  `requestId`.
- Supabase con clientes anon/admin separados y credenciales solo server-side.
- Repositories híbridos para conversaciones, productos, órdenes, leads y
  clientes.
- Persistencia de mensajes, ejecuciones y eventos con fallback por operación.
- API interna protegida para operar catálogo, leads, clientes y trazabilidad.
- Adapter y webhook WhatsApp placeholder, sin envío externo a Meta.
- Command Center responsive servido por Express después del build.
- OpenAI opcional, limitado a hechos verificados y con fallback local.

## Inicio rápido

Requiere Node.js 18+ y npm 9+.

```bash
npm install
npm --prefix frontend install
cp .env.example .env
npm run dev
```

- Aplicación integrada: `http://127.0.0.1:3000`
- Vite en desarrollo: `http://127.0.0.1:5173`

Para servir el dashboard desde Express:

```bash
npm run build
npm start
```

## Configuración

```env
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://127.0.0.1:5173

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
USE_SUPABASE=false

INTERNAL_API_KEY=replace_with_a_long_random_value
ALLOW_INTERNAL_NO_KEY=false
AI_DEFAULT_LANGUAGE=es
AI_WORKERS_MODE=hybrid

WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v23.0
```

`SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_API_KEY` y los tokens de WhatsApp son
secretos de servidor. No deben exponerse como variables `VITE_*`, incluirse en
logs ni comprometerse en Git. `AI_WORKERS_MODE=mock` desactiva Supabase y
OpenAI; `hybrid` usa los proveedores configurados con fallback local.

## Supabase

1. Crear un proyecto separado de staging.
2. Ejecutar [`supabase/schema.sql`](supabase/schema.sql).
3. Ejecutar [`supabase/seed.sql`](supabase/seed.sql) si se requieren datos demo.
4. Configurar las tres variables Supabase y `USE_SUPABASE=true`.
5. Reiniciar y comprobar `GET /api/health`.

El esquema aditivo contiene `customers`, `products`, `orders`, `order_items`,
`b2b_leads`, `conversations`, `conversation_messages`, `ai_worker_runs` y
`worker_events`. Migra datos desde la tabla legacy `messages` cuando existe.
RLS está habilitado; el backend usa service role y la anon key queda preparada
para auth y políticas futuras.

Consulta [`docs/supabase-setup.md`](docs/supabase-setup.md) para el runbook.

## Chat

```bash
curl -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "customer-001",
    "message": "¿Cuál es el estado de mi orden #123?",
    "conversationId": "opcional",
    "requestId": "web-unique-request-id",
    "channel": "web"
  }'
```

Respuesta:

```json
{
  "reply": "Encontré tu orden #123...",
  "worker": "ordersWorker",
  "intent": "order_status",
  "intentCategory": "orders",
  "conversationId": "uuid-or-memory-id",
  "source": "supabase",
  "idempotentReplay": false,
  "memorySummary": {
    "orderId": "123",
    "lastWorker": "ordersWorker",
    "lastIntent": "order_status"
  },
  "metadata": {
    "orderId": "123",
    "found": true,
    "requiresHuman": false
  }
}
```

Repetir `userId + requestId` devuelve la respuesta guardada sin duplicar
mensajes. Sin Supabase, `source` será `memory`.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health`, `/api/health` | Salud y fuente activa |
| `POST` | `/api/chat` | Orquestación, memoria e idempotencia |
| `POST` | `/api/ivr` | Placeholder de voz |
| `GET` | `/api/products`, `/api/products/search?q=` | Catálogo |
| `GET` | `/api/products/:sku` | Producto por SKU |
| `GET` | `/api/orders`, `/api/orders/:orderNumber` | Órdenes |
| `GET/PATCH` | `/api/leads`, `/api/leads/:id` | Leads B2B |
| `GET` | `/api/conversations`, `/api/conversations/:id` | Conversaciones |
| `GET` | `/api/worker-runs` | Ejecuciones de workers |
| `GET/POST` | `/api/webhooks/whatsapp` | Verificación y entrada WhatsApp |

El Command Center usa también `/api/dashboard`, `/api/workers`, `/api/events`,
`/api/handoffs`, `/api/integrations` y `/api/settings`.

## API interna

Fuera de tests requiere `x-internal-api-key: <INTERNAL_API_KEY>`.
`ALLOW_INTERNAL_NO_KEY=true` existe solo para desarrollo local controlado.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/internal/conversations` | Conversaciones |
| `GET/POST` | `/api/internal/leads` | Listar o crear leads |
| `PATCH` | `/api/internal/leads/:leadId/status` | Estado validado |
| `POST` | `/api/internal/leads/:leadId/notes` | Agregar nota |
| `GET` | `/api/internal/products` | Catálogo y filtros |
| `GET` | `/api/internal/products/search?q=` | Búsqueda |
| `POST` | `/api/internal/products/sync-mocks` | Seed protegido de staging |
| `GET` | `/api/internal/orders/:orderNumber` | Detalle de orden |
| `GET/POST` | `/api/internal/customers` | Clientes |
| `GET` | `/api/internal/worker-events` | Eventos de workers |

## Fallbacks

- Sin Supabase: conversaciones/eventos en memoria y datos de negocio en mocks.
- Sin OpenAI: respuestas deterministas basadas en los hechos de repositories.
- Sin WhatsApp: webhook local funcional, sin firma HMAC ni llamadas a Meta.
- Ningún worker inventa precio, stock, estado de orden o fecha de entrega.

## Validación

```bash
npm test
npm run test:frontend
npm run test:all
npm run build
```

Las pruebas fuerzan modo local y no llaman servicios externos.

## Arquitectura

```text
src/
├── adapters/               # Contratos de canales como WhatsApp
├── config/                 # Entorno y clientes Supabase
├── controllers/            # Contrato HTTP
├── data/repositories/      # Supabase + fallback local
├── middleware/             # Logging, errores y auth interna
├── routes/                 # Chat, IVR, datos, internos y webhooks
└── services/
    ├── workers/            # Support, sales, orders, B2B, handoff
    ├── agent.js            # Orquestación e idempotencia
    ├── memoryService.js
    ├── workerEventService.js
    └── aiResponseService.js

supabase/                   # Esquema y seed de staging
frontend/                   # Command Center React + Vite
docs/                       # Runbooks y roadmaps
```

## Sprint 7 recomendado

- Migraciones versionadas y CI/CD de staging.
- Auth administrativa, RBAC y auditoría.
- Firma HMAC, envío real y reintentos de WhatsApp Business.
- Cola de trabajos para procesos asíncronos.
- Sincronización de catálogo e inventario productivos.
- RAG híbrido con pgvector y evaluaciones.
- Analytics de calidad, conversión, costo y latencia.

Consulta [`CODEX_CHECKPOINT.md`](CODEX_CHECKPOINT.md),
[`docs/whatsapp-roadmap.md`](docs/whatsapp-roadmap.md) y
[`docs/rag-roadmap.md`](docs/rag-roadmap.md).
