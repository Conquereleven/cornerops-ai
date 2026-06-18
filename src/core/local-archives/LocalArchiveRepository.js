class LocalArchiveRepository {
  constructor({ adapter, searchIndex }) {
    this.adapter = adapter;
    this.searchIndex = searchIndex;
  }

  listRecords(filters) {
    return this.adapter.listRecords(filters);
  }

  getRecordById(id) {
    return this.adapter.getRecordById(id);
  }

  async search(query) {
    const records = await this.adapter.listRecords(query.filters || {});
    const filtered = query.sourceIds?.length
      ? records.filter((record) => query.sourceIds.includes(record.sourceId))
      : records;
    const results = this.searchIndex.search(filtered, query.query);
    return results.slice(0, query.limit || 20);
  }

  healthCheck() {
    return this.adapter.healthCheck();
  }
}

module.exports = {
  LocalArchiveRepository,
};
