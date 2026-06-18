const crawlerDefaults = (config = {}) => {
  const base = (id, options = {}) => ({
    id,
    name: options.name || id,
    enabled: Boolean(config.crawlersEnabled && options.enabled),
    dryRun: options.dryRun ?? true,
    mode: options.mode || 'mock',
    sourceId: options.sourceId,
    allowedOperations: options.allowedOperations || ['healthCheck', 'dryRunSync', 'search', 'getRecordById', 'sync'],
    requiresApprovalFor: options.requiresApprovalFor || ['sync'],
    riskLevel: options.riskLevel || 'medium',
  });
  return [
    base('gitcrawl', { name: 'gitcrawl', enabled: config.gitcrawlEnabled, sourceId: 'github_archive', riskLevel: 'medium' }),
    base('slacrawl', { name: 'slacrawl', enabled: config.slacrawlEnabled, sourceId: 'slack_archive', riskLevel: 'high' }),
    base('wacrawl', { name: 'wacrawl', enabled: config.wacrawlEnabled, sourceId: 'whatsapp_archive', riskLevel: 'critical' }),
    base('notcrawl', { name: 'notcrawl', enabled: config.notcrawlEnabled, sourceId: 'notion_archive', riskLevel: 'high' }),
    base('telecrawl', { name: 'telecrawl', enabled: config.telecrawlEnabled, sourceId: 'telegram_archive', riskLevel: 'critical' }),
    base('discrawl', { name: 'discrawl', enabled: config.discrawlEnabled, sourceId: 'discord_archive', mode: 'document_only' }),
    base('graincrawl', { name: 'graincrawl', enabled: config.graincrawlEnabled, sourceId: 'granola_notes', mode: 'document_only' }),
    base('imsgcrawl', { name: 'imsgcrawl', enabled: false, sourceId: 'apple_messages', mode: 'document_only', riskLevel: 'critical' }),
    base('photoscrawl', { name: 'photoscrawl', enabled: false, sourceId: 'apple_photos', mode: 'document_only', riskLevel: 'critical' }),
    base('crawlkit', { name: 'crawlkit', enabled: config.crawlersEnabled, sourceId: 'manual_uploads', riskLevel: 'low' }),
  ];
};

class CrawlerRegistry {
  constructor({ crawlers, config = {} } = {}) {
    this.crawlers = new Map();
    (crawlers || crawlerDefaults(config)).forEach((crawler) => this.register(crawler));
  }

  register(crawler) {
    if (!crawler?.id) throw new Error('Crawler id is required.');
    this.crawlers.set(crawler.id, { ...crawler });
    return this.get(crawler.id);
  }

  list() {
    return Array.from(this.crawlers.values()).map((crawler) => ({ ...crawler }));
  }

  get(id) {
    const crawler = this.crawlers.get(id);
    return crawler ? { ...crawler } : null;
  }
}

module.exports = {
  CrawlerRegistry,
  crawlerDefaults,
};
