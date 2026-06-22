const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class WacrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'wacrawl', sourceId: 'whatsapp_archive' });
  }
}

module.exports = { WacrawlAdapter };
