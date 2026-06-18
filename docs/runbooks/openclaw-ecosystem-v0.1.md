# Runbook: OpenClaw Ecosystem v0.1

## Activar Simulacion

```bash
OPENCLAW_ECOSYSTEM_ENABLED=true
CRABOX_ENABLED=true
OCTOPOOL_ENABLED=true
CLAWHUB_ENABLED=true
LOBSTER_ENABLED=true
```

Mantener dry-run/read-only.

## Revisar Servicios

`GET /api/openclaw-ecosystem/services` o `npm run demo:ecosystem`.

## Crabox Dry Run

`POST /api/openclaw-ecosystem/crabox/run-suite` devuelve simulacion. No corre scripts reales.

## Octopool Relay

Lecturas GitHub pueden pasar por Octopool si esta habilitado. No escribe en GitHub.

## ClawHub

Listar approved skills con `GET /api/openclaw-ecosystem/skills`. Proponer review con `POST /api/openclaw-ecosystem/skills/review`. Aprobar/deshabilitar exige approval.

## Lobster

`POST /api/openclaw-ecosystem/lobster/workflows/dry-run` simula workflows.

## Bloqueo

Desactivar servicio con su flag `*_ENABLED=false`. Revisar audit logs ante denials o intentos de permisos altos.
