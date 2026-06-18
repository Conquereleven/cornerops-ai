# Runbook: Real Data Integration v0.1

## Modo Mock

Usar defaults:

```bash
CORNEROPS_DATA_MODE=mock
CORNEROPS_DRY_RUN=true
```

Probar:

```bash
npm run demo:real-data
```

## Modo Read-only

Configurar `CORNEROPS_DATA_MODE=read_only`, provider y credenciales. En v0.1 los adapters reales estan como placeholders seguros; no correr migraciones.

## Conectar DB

Definir `CORNEROPS_DATABASE_PROVIDER=supabase` o `postgres`, `DATABASE_URL`/Supabase vars. Antes de produccion, implementar adapter real y revisar `src/integrations/database/migrations/schema.sql`.

## Conectar GitHub

Definir `GITHUB_ENABLED=true`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`. Mantener `GITHUB_DRY_RUN=true` hasta aprobar escritura real.

## Revisar Data Health

API: `GET /api/data-health`.

## Desactivar Todo

`CORNEROPS_REAL_DATA_ENABLED=false`, `CORNEROPS_SYNC_ENABLED=false`, `OPENCLAW_ECOSYSTEM_ENABLED=false`.

## Fallos

- GitHub falla: usar fixtures mock y revisar `GITHUB_DRY_RUN`.
- DB falla: fallback a mock.
- OpenClaw falla: agentes siguen operando local/dry-run.
