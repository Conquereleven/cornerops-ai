# Runbook: Context Knowledge Layer v0.2

## Demos

```bash
npm run demo:context
npm run demo:crawlers
npm run demo:knowledge-search
npm run demo:context-health
```

## Enable Mock Context

Set:

```env
CORNEROPS_CONTEXT_LAYER_ENABLED=true
CORNEROPS_CONTEXT_MODE=mock
CORNEROPS_CONTEXT_DRY_RUN=true
```

Enable specific mock sources with `GITHUB_CONTEXT_ENABLED`, `SLACK_CONTEXT_ENABLED`, `WHATSAPP_CONTEXT_ENABLED`, `TELEGRAM_CONTEXT_ENABLED`, `NOTION_CONTEXT_ENABLED`.

## Search

API: `GET /api/context/search?q=Tajin`.

## Request Sync

Use `POST /api/context/sources/:id/sync-request`. It returns dry-run/approval-required.

## Disable Source

Set the source flag to `false` and restart. Disabled sources return no results.

## Debug

Check `GET /api/context/health`, audit logs and source definitions.
