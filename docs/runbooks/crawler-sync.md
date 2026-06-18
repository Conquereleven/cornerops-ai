# Runbook: Crawler Sync

Crawler sync is dry-run by default.

1. Enable `CORNEROPS_CONTEXT_LAYER_ENABLED=true`.
2. Enable `CRAWLERS_ENABLED=true`.
3. Enable a specific crawler flag.
4. Run `npm run demo:crawlers`.
5. For real sync, create an approval request first.

No crawler reads real Slack, WhatsApp, Telegram, Notion or GitHub accounts without credentials, read-only mode and approval.
