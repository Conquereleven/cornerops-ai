class PostgresAdapter {
  constructor({ enabled = false } = {}) {
    this.enabled = enabled;
  }

  async health() {
    return {
      connected: false,
      provider: 'postgres',
      status: this.enabled ? 'not_configured' : 'disabled',
      note: 'Postgres adapter is a safe placeholder; no migrations or writes run in v0.1.',
    };
  }
}

module.exports = {
  PostgresAdapter,
};
