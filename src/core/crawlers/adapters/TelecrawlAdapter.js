const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class TelecrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'telecrawl', sourceId: 'telegram_archive' });
  }
}

module.exports = { TelecrawlAdapter };
