const { CrawlkitAdapter } = require('./CrawlkitAdapter');

class GitcrawlAdapter extends CrawlkitAdapter {
  constructor(options = {}) {
    super({ ...options, crawlerId: 'gitcrawl', sourceId: 'github_archive' });
  }
}

module.exports = { GitcrawlAdapter };
