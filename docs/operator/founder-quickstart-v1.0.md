# Founder Quickstart v1.0

## First run

```bash
git pull
npm install
npm --prefix frontend install
cp .env.founder.local.example .env
npm run founder:setup-check
npm run qa
npm run founder:daily
npm run demo:v0.9
npm run demo:v1.0
npm run demo:v1.1
npm run build
npm start
```

Open `http://127.0.0.1:3000/control-tower`, enter the local console token from `.env`, then verify:

- Founder Beta Readiness is ready or only has understood warnings.
- Real Source Expansion v1.1 shows GitHub and Business DB source modes clearly.
- Controlled actions are dry-run.
- GitHub real issue creation is disabled.
- External sends and writes are blocked.
- Approval Center, Audit Viewer, Security Dashboard and Operator Ask are visible.

## Daily use

```bash
npm run founder:setup-check
npm run founder:daily
npm run state:export-summary
npm run state:backup
```

Use Operator Ask for:

- “Dame mi briefing de hoy”
- “Qué leads B2B tengo pendientes”
- “Revisa quotes sin seguimiento”
- “Crea un issue draft para este bug”
- “Revisa eventos de seguridad recientes”

## Controlled actions

```bash
npm run cornerops -- actions
npm run cornerops -- ask "Create a GitHub issue draft for manual payment audit IDs"
npm run cornerops -- approvals
npm run cornerops -- approvals execute-dry-run <approval-id>
```

Real GitHub issue creation remains off by default.

## Real source checks

```bash
npm run github:read-only-check
npm run business-data:read-only-check
npm run demo:real-sources
```

These commands run without credentials and fall back to labeled mock mode. They never mutate GitHub or business data.

## Shutdown

Stop the server with `Ctrl+C`, then run:

```bash
npm run state:backup
```
