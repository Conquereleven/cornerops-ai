const path = require('path');
const { ContextNormalizer } = require('../context/ContextNormalizer');

const fixture = (relativePath) =>
  require(path.resolve(__dirname, '../../..', 'tests/fixtures/context', relativePath));

class LocalArchiveMockAdapter {
  constructor({ normalizer = new ContextNormalizer() } = {}) {
    this.normalizer = normalizer;
  }

  loadRecords() {
    return [
      ...fixture('github-context.sample.json'),
      ...fixture('slack-context.sample.json'),
      ...fixture('whatsapp-context.sample.json'),
      ...fixture('telegram-context.sample.json'),
      ...fixture('notion-context.sample.json'),
      ...fixture('pdf-context.sample.json'),
      ...fixture('google-places.sample.json'),
    ].map((record) => this.normalizer.normalizeRecord(record));
  }

  async listRecords(filters = {}) {
    return this.loadRecords().filter((record) => {
      if (filters.sourceId && record.sourceId !== filters.sourceId) return false;
      if (filters.sourceIds?.length && !filters.sourceIds.includes(record.sourceId)) return false;
      if (filters.relatedLeadId && record.relatedLeadId !== filters.relatedLeadId) return false;
      if (filters.relatedQuoteId && record.relatedQuoteId !== filters.relatedQuoteId) return false;
      if (filters.relatedOrderId && record.relatedOrderId !== filters.relatedOrderId) return false;
      if (filters.tags?.length && !filters.tags.every((tag) => record.tags.includes(tag))) return false;
      return true;
    });
  }

  async getRecordById(id) {
    return (await this.listRecords()).find((record) => record.id === id) || null;
  }

  async healthCheck() {
    const records = await this.listRecords();
    return {
      adapter: 'mock',
      connected: true,
      recordCount: records.length,
      lastIndexedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  LocalArchiveMockAdapter,
};
