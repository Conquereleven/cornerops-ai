# CórnerOps AI Workers

Plataforma interna de AI Workers 24/7 para Cornermex UAE. Atiende soporte,
ventas retail, consultas de órdenes, captación B2B y operación desde un Command
Center. El backend funciona con Supabase real o mocks deterministas y no
requiere OpenAI para operar.

## Estado Sprint 4 + 5

- Routing ES/EN para soporte, ventas, órdenes, B2B, handoff y unknown.
- Prioridad B2B para mayoreo, cajas, volumen, HoReCa, tiendas y cotizaciones.
- Memoria por conversación con entidades comerciales y `memorySummary`.
- Workers repository-backed sin inventar precio, stock, órdenes ni entregas.
- Leads B2B progresivos, órdenes por número/email y catálogo por keywords.
- Supabase opcional con fallback por operación a mocks.
- Persistencia de conversaciones, mensajes, leads y ejecuciones.
- Endpoints públicos, mock, operativos e internos con API key.
- Servicio OpenAI opcional con hechos verificados y fallback local.
- Base preparada para RAG de catálogo, WhatsApp, voz y auth administrativa.

## Requisitos e instalación

- Node.js 18+
- npm 9+
- Supabase y OpenAI opcionales

```bash
npm install
npm --prefix frontend install
cp .env.example .env
npm run dev
```

- API integrada: `http://127.0.0.1:3000`
- Frontend Vite en desarrollo: `http://127.0.0.1:5173`
- Dashboard con build: `http://127.0.0.1:3000`

```bash
npm run build
npm start
```

## Variables de entorno

```env
PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://127.0.0.1:5173

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
USE_SUPABASE=false

INTERNAL_API_KEY=replace_with_a_long_random_value
```

`SUPABASE_SERVICE_ROLE_KEY` es exclusivamente server-side. Nunca debe aparecer
en variables `VITE_*`, frontend, logs o commits. En tests se fuerza modo mock.
Si OpenAI o Supabase no están disponibles, los workers mantienen respuestas y
datos consistentes mediante fallbacks locales.

## Supabase

1. Ejecutar `src/data/supabase/schema.sql`.
2. Ejecutar `src/data/supabase/seed.sql`.
3. Configurar URL y una key de servidor en `.env`.
4. Activar `USE_SUPABASE=true`.
5. Reiniciar y comprobar `GET /api/health`.

El esquema es idempotente y contiene `customers`, `products`, `orders`,
`order_items`, `b2b_leads`, `conversations`, `messages` y `ai_worker_runs`.
RLS está habilitado. El backend prefiere service role; la anon key queda lista
para políticas y auth futuras.

## API pública

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health`, `/api/health` | Salud y fuente activa |
| `POST` | `/api/chat` | Orquestación, memoria y persistencia |
| `POST` | `/api/ivr` | Placeholder de voz |
| `GET` | `/api/orders` | Lista y filtros |
| `GET` | `/api/orders/:orderNumber` | Orden por número |
| `GET` | `/api/products` | Catálogo y filtros |
| `GET` | `/api/products/search?q=` | Búsqueda de catálogo |
| `GET` | `/api/products/:sku` | Producto por SKU |
| `GET` | `/api/leads` | Leads B2B |
| `GET/PATCH` | `/api/leads/:id` | Detalle o actualización |
| `GET` | `/api/conversations` | Conversaciones |
| `GET` | `/api/conversations/:id` | Conversación con mensajes |
| `GET` | `/api/worker-runs` | Trazabilidad de workers |

Compatibilidad mock:

- `GET /api/mock/orders`
- `GET /api/mock/products`
- `GET /api/mock/leads`

## API interna

Fuera de tests requiere `x-internal-api-key: <INTERNAL_API_KEY>`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/internal/conversations` | Listar conversaciones |
| `GET` | `/api/internal/conversations/:id` | Detalle |
| `GET` | `/api/internal/leads` | Listar leads |
| `POST` | `/api/internal/leads` | Crear lead |
| `PATCH` | `/api/internal/leads/:leadId/status` | Cambiar estado |
| `GET` | `/api/internal/products` | Catálogo interno |
| `GET` | `/api/internal/orders` | Órdenes internas |

El Command Center conserva además `/api/dashboard`, `/api/workers`,
`/api/events`, `/api/handoffs`, `/api/integrations` y `/api/settings`.

## Chat

```bash
curl -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "customer-001",
    "message": "¿Cuál es el estado de mi orden #123?",
    "conversationId": "opcional"
  }'
```

Respuesta:

```json
{
  "reply": "Encontré tu orden #123...",
  "worker": "ordersWorker",
  "intent": "order_status",
  "intentCategory": "orders",
  "conversationId": "uuid-or-mock-id",
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

Los intents detallados existentes se conservan para compatibilidad. La nueva
`intentCategory` expone el contrato canónico `support`, `sales`, `orders`,
`b2b` o `unknown`.

## Pruebas

```bash
npm test
npm run test:frontend
npm run test:all
npm run build
```

Las pruebas no llaman OpenAI, Supabase ni otros servicios externos.

## Arquitectura

```text
src/
├── config/                 # Entorno y selección Supabase
├── controllers/            # Contrato HTTP
├── data/
│   ├── repositories/       # Supabase + fallback mock
│   └── supabase/           # Esquema y seed
├── middleware/             # Logging, errores y API key interna
├── routes/                 # Chat, IVR, datos e internos
├── services/
│   ├── workers/            # Support, sales, orders, B2B, handoff
│   ├── memoryService.js
│   ├── aiResponseService.js
│   └── catalogSearchService.js
└── utils/
```

## Sprint 6

- Migraciones versionadas y staging aislado.
- Auth administrativa y RBAC.
- Catálogo e inventario reales.
- WhatsApp Business API.
- Voice pipeline con transcripción y TTS.
- RAG híbrido con Supabase pgvector y evaluaciones.
- Analytics de calidad, costo, latencia, handoff y conversión.

Consulta `CODEX_CHECKPOINT.md` y `docs/rag-roadmap.md` para el handoff técnico.
