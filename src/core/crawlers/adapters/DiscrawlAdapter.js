const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class DiscrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'discrawl', sourceId: 'discord_archive' });
  }
}

module.exports = { DiscrawlAdapter };
