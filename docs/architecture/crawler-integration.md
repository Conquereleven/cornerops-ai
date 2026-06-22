# Crawler Integration

Integrated/stubbed now:

- `gitcrawl`: GitHub archive context.
- `slacrawl`: Slack thread/message context.
- `wacrawl`: WhatsApp archive search, no sending.
- `notcrawl`: Notion notes/docs.
- `telecrawl`: Telegram archive search, no sending.
- `crawlkit`: shared adapter behavior.

Document-only:

- `discrawl`, `graincrawl`, `imsgcrawl`, `photoscrawl`, `crawlbar`.

All adapters support `healthCheck`, `dryRunSync`, `search` and `getRecordById`. Real sync requires source flags and approval.

## Add A Crawler

1. Add source in `ContextSourceRegistry`.
2. Add crawler definition in `CrawlerRegistry`.
3. Extend `CrawlkitAdapter`.
4. Add fixture, tests, docs and audit coverage.
