class LocalArchiveSQLiteAdapter {
  constructor({ dbPath, enabled = false } = {}) {
    this.dbPath = dbPath;
    this.enabled = enabled;
  }

  async healthCheck() {
    return {
      adapter: 'sqlite',
      connected: false,
      dbPath: this.dbPath,
      status: this.enabled ? 'not_configured' : 'disabled',
      message: 'SQLite archive adapter is stubbed in v0.2; mock adapter is used unless a safe local driver is added.',
    };
  }
}

module.exports = {
  LocalArchiveSQLiteAdapter,
};
