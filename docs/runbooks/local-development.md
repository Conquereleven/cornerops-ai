# Local Development Runbook

```bash
npm install
npm --prefix frontend install
cp .env.example .env
npm run dev
```

OpenClaw remains disabled until explicitly enabled:

```env
OPENCLAW_ENABLED=false
OPENCLAW_DRY_RUN=true
```

Run validation:

```bash
npm run lint
npm run typecheck
npm test
npm run test:frontend
npm run build
```
