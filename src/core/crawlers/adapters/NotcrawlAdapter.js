const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class NotcrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'notcrawl', sourceId: 'notion_archive' });
  }
}

module.exports = { NotcrawlAdapter };
