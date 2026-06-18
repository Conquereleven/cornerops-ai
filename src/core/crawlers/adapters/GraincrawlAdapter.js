const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class GraincrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'graincrawl', sourceId: 'granola_notes' });
  }
}

module.exports = { GraincrawlAdapter };
