# CórnerOps AI Command Center

Frontend React + TypeScript para operar y observar los AI Workers de Cornermex
UAE. La dirección visual reproduce el concepto **AI Mission Control**:
dark-mode, alta densidad operativa, chat central y telemetría de workers.

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación queda disponible en `http://127.0.0.1:5173`.

## Configuración

```env
VITE_API_BASE_URL=
```

El backend debe ejecutarse desde la raíz del proyecto:

```bash
npm run dev
```

Desde la raíz del proyecto también puedes levantar backend y frontend juntos:

```bash
npm run dev
```

## Verificación

```bash
npm test
npm run build
```

La suite cubre el render del Command Center, el contrato del cliente API y el
input de chat. Por defecto el cliente usa rutas de mismo origen. Vite redirige
`/api` y `/health` al backend local durante desarrollo; configura
`VITE_API_BASE_URL` únicamente cuando la API vive en otro dominio.

## Pantallas

- `/` Overview y Mission Control.
- `/chat` AI Chat Center.
- `/conversations` memoria conversacional.
- `/orders` órdenes mock del repository.
- `/products` catálogo, precio AED e inventario.
- `/leads` oportunidades B2B.
- `/worker-settings` estado y configuración visual.
- `/integrations` roadmap de canales.
- `/settings` configuración general.

Los listados usan los endpoints reales cuando están disponibles y datos fallback
cuando el backend no responde. El chat muestra un error claro sin romper la UI.

## Build

```bash
npm run build
```

## Próximos pasos UI

1. Autenticación y roles.
2. Métricas reales desde `ai_worker_runs`.
3. Edición persistente de prompts.
4. Detalle de conversación con replay.
5. Handoff humano y cola operativa.
6. Configuración real de Supabase, WhatsApp y voz.

## Authentication and workspace access

- Sign-in uses Supabase Auth with PKCE. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time (see `.env.example`). Without them `/login` states that sign-in is unavailable and `/app` stays closed.
- Never put a secret or service-role key in a `VITE_` variable.
- Identity does not grant access. After sign-in the app asks `GET /api/app/session`; only a server-side workspace membership opens `/app/*`.
- Private routes live under `/app`. Pre-consolidation paths such as `/overview` redirect there from inside the same guard.
- Navigation is driven by `src/config/moduleRegistry.ts` (`surface`: core, admin, incubator, hidden).
- Public contact values and the canonical site URL come from `VITE_PUBLIC_*` (see `src/config/siteConfig.ts`).

Runbooks: `docs/runbooks/cornerops-auth-callbacks-v1.md`, `docs/runbooks/cornerops-staging-rollout-v1.md`.
