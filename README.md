# CornerOps AI

CornerOps AI is the internal AI operating system for CornerMex. It coordinates
business operations, agents, workflows, memory, tools, integrations and
human-approved automation. OpenClaw is integrated only as a self-hosted
multi-channel gateway and controlled execution layer.

CornerOps AI is the brain. OpenClaw is the gateway.

## Estado Actual

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
- OpenClaw foundation en modo seguro: desactivado/dry-run por defecto, router
  multicanal, policies, approvals y audit logs.
- CornerOps Core Agent Pack v0.1 con seis agentes internos, routing por
  intención, permisos por agente, dry run, approvals y auditoría.
- Real Data + OpenClaw Ecosystem v0.1 con datos canonicos mock/read-only,
  tools internas para agentes, GitHub dry-run, data health, audit logs
  sanitizados y adapters controlados para servicios OpenClaw.
- Context & Knowledge Layer v0.2 con local-first archives mock, source registry,
  context search, crawler stubs, SDK bridges, native tool policy, PII masking y
  demos sin credenciales.
- Internal Beta & Business Data v0.4 con frontera DB SELECT-only, schema
  discovery auditado, contratos Lead/Quote/Order, repositorios read-only,
  metadata de fuente, PII masking y Control Tower beta.
- Control Tower Web Console v0.8 con reporte unificado, cockpit React local,
  Approval Center dry-run, Audit Viewer sanitizado, Security Dashboard,
  Operator Ask auditado y reporte HTML local.

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

CORNEROPS_AGENTS_ENABLED=true
CORNEROPS_AGENT_PACK_VERSION=v0.1
CORNEROPS_DEFAULT_AGENT=cornerops-router-agent
CORNEROPS_DRY_RUN=true
CORNEROPS_REQUIRE_APPROVAL=true
CORNEROPS_AUDIT_ENABLED=true
CORNEROPS_AGENT_ENABLED_IDS=
CORNEROPS_AGENT_DISABLED_IDS=
CORNEROPS_AGENT_ALLOWED_USERS=
CORNEROPS_REAL_DATA_ENABLED=false
CORNEROPS_DATA_MODE=mock
CORNEROPS_ALLOWED_DATA_SOURCES=leads,quotes,orders,github,audit_logs,approvals,agent_logs,sync_status
CORNEROPS_SYNC_ENABLED=false
CORNEROPS_SYNC_INTERVAL_MINUTES=15
CORNEROPS_DATABASE_PROVIDER=

WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v23.0

OPENCLAW_ENABLED=false
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=
OPENCLAW_GATEWAY_PASSWORD=
OPENCLAW_DEFAULT_MODEL=openclaw/default
OPENCLAW_TIMEOUT_MS=30000
OPENCLAW_MAX_RETRIES=2
OPENCLAW_DRY_RUN=true
OPENCLAW_REQUIRE_APPROVAL=true
OPENCLAW_AUDIT_ENABLED=true
OPENCLAW_ALLOWED_CHANNELS=whatsapp,telegram,slack
OPENCLAW_ALLOWED_USERS=
OPENCLAW_ALLOWED_TOOLS=
OPENCLAW_SANDBOX_MODE=non-main

GITHUB_ENABLED=false
GITHUB_DRY_RUN=true
GITHUB_TOKEN=
GITHUB_OWNER=Conquereleven
GITHUB_REPO=cornerops-ai
GITHUB_WEBHOOK_SECRET=

OPENCLAW_ECOSYSTEM_ENABLED=false
CRABOX_ENABLED=false
CRABOX_DRY_RUN=true
OCTOPOOL_ENABLED=false
OCTOPOOL_DRY_RUN=true
CLAWHUB_ENABLED=false
CLAWHUB_READ_ONLY=true
CLAWHUB_ALLOWLIST_ONLY=true
LOBSTER_ENABLED=false
LOBSTER_DRY_RUN=true

CORNEROPS_CONTEXT_LAYER_ENABLED=false
CORNEROPS_CONTEXT_MODE=mock
CORNEROPS_CONTEXT_DRY_RUN=true
CORNEROPS_CONTEXT_READ_ONLY=true
CORNEROPS_CONTEXT_REQUIRE_APPROVAL=true
CORNEROPS_CONTEXT_AUDIT_ENABLED=true
CORNEROPS_LOCAL_ARCHIVES_PATH=./.cornerops/archives
CORNEROPS_LOCAL_ARCHIVES_DB=./.cornerops/archives/context.sqlite
CORNEROPS_CONTEXT_RETENTION_DAYS=180
CORNEROPS_CONTEXT_PII_MASKING=true
CRAWLERS_ENABLED=false
GITCRAWL_ENABLED=false
SLACRAWL_ENABLED=false
WACRAWL_ENABLED=false
NOTCRAWL_ENABLED=false
TELECRAWL_ENABLED=false
FS_SAFE_ENABLED=true
CLAWSAFE_ROOT=./.cornerops
```

`SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_API_KEY` y los tokens de WhatsApp son
secretos de servidor. No deben exponerse como variables `VITE_*`, incluirse en
logs ni comprometerse en Git. `AI_WORKERS_MODE=mock` desactiva Supabase y
OpenAI; `hybrid` usa los proveedores configurados con fallback local.
OpenClaw inicia apagado y en dry run para evitar ejecuciones reales.
Los agentes de CornerOps inician en dry run y requieren aprobación humana para
acciones sensibles.

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

## Internal beta v0.3

La fase v0.3 endurece el sistema antes de conectar más fuentes. CornerOps sigue
siendo el cerebro y OpenClaw permanece como gateway/capa de capacidades
controladas. Por defecto GitHub, OpenClaw, crawlers, canales y herramientas
nativas no realizan acciones reales.

```bash
npm run qa
npm run control:tower
npm run demo:beta
```

El primer source real permitido es GitHub en read-only y requiere simultáneamente
`CORNEROPS_REAL_SOURCE_ONBOARDING_ENABLED=true`, `GITHUB_ENABLED=true`,
`GITHUB_READ_ONLY=true` y un token de mínimo privilegio. Las escrituras siguen
bloqueadas por `GITHUB_ALLOW_* = false` y `GITHUB_DRY_RUN=true`.

Runbooks: [`QA v0.3`](docs/runbooks/qa-hardening-v0.3.md),
[`beta ops`](docs/runbooks/internal-beta-ops.md) y
[`GitHub read-only`](docs/runbooks/first-real-source-github.md).

## Internal beta v0.4

El onboarding de datos de negocio usa `SUPABASE_READONLY_KEY` o una conexión
Postgres dedicada. Nunca reutiliza `SUPABASE_SERVICE_ROLE_KEY`. Sin credenciales
read-only, todo sigue funcionando con fixtures sanitizados.

```bash
npm run control:tower:beta
npm run demo:business-data
npm run demo:control-tower
npm run demo:beta
```

Arquitectura: [`business data read-only`](docs/architecture/business-data-read-only.md),
[`data contracts`](docs/architecture/business-data-contracts.md) y
[`Control Tower v0.4`](docs/architecture/control-tower-v0.4.md).
Operación: [`beta workflow`](docs/beta/operator-workflow-v0.4.md) y
[`onboarding runbook`](docs/runbooks/business-data-read-only-onboarding.md).

## Interactive Beta v0.5

El fundador puede operar CornerOps localmente mediante una CLI segura. Cada
respuesta muestra fuente, aprobación, warnings y `auditId`; los datos mock se
etiquetan explícitamente y ninguna aprobación ejecuta acciones reales.

```bash
npm run cornerops -- help
npm run cornerops -- briefing
npm run cornerops -- ask "Which B2B leads need follow-up?"
npm run cornerops -- ask "Which quotes need follow-up?"
npm run cornerops -- control
npm run cornerops -- approvals
npm run cornerops -- audit denied
npm run demo:interactive-beta
```

`npm run cornerops` abre una sesión interactiva local. La API operator permanece
apagada con `CORNEROPS_API_ENABLED=false` y la vista web queda fuera de v0.5.
Consulta [`quickstart`](docs/operator/quickstart-v0.5.md),
[`commands`](docs/operator/commands-v0.5.md) y
[`founder workflow`](docs/operator/founder-workflow-v0.5.md).

## Real Operator Channel v0.6

CornerOps now has a generic, allowlist-only operator-channel boundary and a
credential-free mock demo. Telegram private DM is the first real provider
prepared, but global/provider flags and reply delivery remain disabled and
dry-run by default. A strict OpenClaw bridge is available; Slack events,
WhatsApp, groups, proactive sends, customer channels and all production writes
remain disabled.

```bash
npm run demo:operator-channel
npm run demo:real-operator-channel
```

Every accepted message still flows through CornerOps policy,
`OperatorCommandRouter`, approvals and sanitized audit. See the
[`channel guide`](docs/operator/real-operator-channel-v0.6.md),
[`setup runbook`](docs/runbooks/operator-channel-setup.md) and
[`security model`](docs/security/operator-channel-security-v0.6.md).

## Control Tower Web Console v0.8

The founder cockpit reuses the existing React/Vite application and a guarded,
versioned Express API. It is disabled by default and requires localhost, a
private token, read-only, dry-run and fail-closed controls when enabled.

```bash
npm run demo:v0.8
npm run control:tower:web-report
npm run build
npm start
```

After private local configuration, open `http://127.0.0.1:3000/control-tower`.
See [`console guide`](docs/operator/control-tower-web-console-v0.8.md),
[`security model`](docs/security/web-console-security-v0.8.md) and
[`runbook`](docs/runbooks/control-tower-web-v0.8.md).

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
| `GET` | `/api/orders/requiring-action`, `/api/orders/manual-payments` | Órdenes que requieren acción |
| `GET/PATCH` | `/api/leads`, `/api/leads/:id` | Leads B2B |
| `GET` | `/api/leads/follow-up` | Leads que requieren seguimiento |
| `GET` | `/api/quotes`, `/api/quotes/follow-up` | Quotes mock/read-only |
| `GET` | `/api/github/issues`, `/api/github/pull-requests`, `/api/github/workflow-runs` | GitHub mock/read-only |
| `POST` | `/api/github/issues/draft` | Draft de issue sin escritura real |
| `GET` | `/api/audit-logs`, `/api/approvals`, `/api/data-health` | Torre de control |
| `GET` | `/api/control-tower/beta`, `/api/control-tower/data-contracts`, `/api/control-tower/schema-discovery` | Operación beta y contratos read-only |
| `GET` | `/api/openclaw-ecosystem/services`, `/api/openclaw-ecosystem/skills` | Ecosistema OpenClaw controlado |
| `GET` | `/api/context/search`, `/api/context/sources`, `/api/context/health` | Context & Knowledge Layer |
| `GET` | `/api/local-archives/records` | Local archive mock records |
| `GET` | `/api/crawlers`, `/api/native-tools` | Crawler/native tool registries |
| `GET` | `/api/conversations`, `/api/conversations/:id` | Conversaciones |
| `GET` | `/api/worker-runs` | Ejecuciones de workers |
| `GET/POST` | `/api/webhooks/whatsapp` | Verificación y entrada WhatsApp |
| `GET` | `/api/openclaw/health` | Health OpenClaw protegido |
| `POST` | `/api/openclaw/messages` | Entrada OpenClaw dry-run protegida |
| `GET/POST` | `/api/openclaw/approvals` | Aprobaciones humanas |
| `POST` | `/api/openclaw/approvals/:id/approve` | Aprobar acción |
| `POST` | `/api/openclaw/approvals/:id/reject` | Rechazar acción |

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
- Sin OpenClaw o con dry run: no se ejecutan herramientas externas; se devuelve
  fallback seguro y se audita la decisión.
- Ningún worker inventa precio, stock, estado de orden o fecha de entrega.

## Validación

```bash
npm test
npm run lint
npm run typecheck
npm run test:frontend
npm run test:all
npm run build
npm run demo:agents
npm run demo:real-data
npm run demo:ecosystem
npm run demo:cornerops-control-tower
npm run demo:context
npm run demo:crawlers
npm run demo:knowledge-search
npm run demo:context-health
npm run demo:business-data
npm run demo:control-tower
npm run control:tower:beta
```

Las pruebas fuerzan modo local y no llaman servicios externos.

## Arquitectura

```text
src/
├── adapters/               # Contratos de canales como WhatsApp
├── config/                 # Entorno y clientes Supabase
├── controllers/            # Contrato HTTP
├── core/                   # Agent Pack, workflows, policies, audit, memory
├── data/repositories/      # Supabase + fallback local
├── integrations/openclaw/  # Gateway, policies, approvals, audit
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

## Telegram + First Read-Only Source v0.7

v0.7 adds restart-safe replay protection, persistent rejection tracking,
operator rate limiting and a first-source selector. Telegram remains a
founder-only private DM transport and is disabled until credentials and exact
allowlists are configured. The selector uses a verified read-only business DB,
then GitHub, otherwise labeled mock data.

```bash
npm run telegram:check
npm run demo:telegram-activation
npm run demo:first-real-source
npm run demo:v0.7
```

See the [Telegram runbook](docs/runbooks/telegram-operator-runbook-v0.7.md),
[source runbook](docs/runbooks/first-real-source-v0.7.md) and
[replay security model](docs/security/replay-protection-v0.7.md).

## Core Agent Pack v0.1

El primer paquete operativo vive en `src/core`:

- `cornerops-router-agent`
- `daily-briefing-agent`
- `b2b-sales-agent`
- `quotes-orders-agent`
- `dev-codex-github-agent`
- `security-audit-agent`

Todo corre en dry run por defecto. Los agentes pueden preparar resúmenes,
drafts, propuestas y approvals, pero no envían mensajes, no crean issues reales,
no cambian órdenes y no marcan pagos sin aprobación humana.

Demo local:

```bash
npm run demo:agents
```

Documentación:

- [`docs/architecture/agents.md`](docs/architecture/agents.md)
- [`docs/architecture/workflows.md`](docs/architecture/workflows.md)
- [`docs/runbooks/core-agent-pack-v0.1.md`](docs/runbooks/core-agent-pack-v0.1.md)

## OpenClaw

La integración OpenClaw vive en `src/integrations/openclaw` y se documenta en
`docs/openclaw-integration`. Su rol es conectar canales y herramientas con
CornerOps sin mover la lógica de negocio fuera de CornerOps.

Prioridades siguientes:

- Persistir approvals y audit logs.
- Agregar UI de aprobaciones al Command Center.
- Conectar Slack sandbox con allowlist.
- Migrar stores de seguridad a un backend transaccional antes de escalar réplicas.
- Añadir RBAC administrativo.

Consulta [`CODEX_CHECKPOINT.md`](CODEX_CHECKPOINT.md),
[`docs/openclaw-integration/architecture.md`](docs/openclaw-integration/architecture.md),
[`docs/whatsapp-roadmap.md`](docs/whatsapp-roadmap.md) y
[`docs/rag-roadmap.md`](docs/rag-roadmap.md).
