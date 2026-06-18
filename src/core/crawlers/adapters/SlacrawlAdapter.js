const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class SlacrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'slacrawl', sourceId: 'slack_archive' });
  }
}

module.exports = { SlacrawlAdapter };
