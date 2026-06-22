const { MockDataAdapter } = require('./adapters/MockDataAdapter');
const { PostgresAdapter } = require('./adapters/PostgresAdapter');
const { SupabaseAdapter } = require('./adapters/SupabaseAdapter');

class DatabaseClient {
  constructor({ config = {}, mockAdapter } = {}) {
    this.config = config;
    this.mockAdapter = mockAdapter || new MockDataAdapter();
    this.supabaseAdapter = new SupabaseAdapter({
      enabled: config.provider === 'supabase',
    });
    this.postgresAdapter = new PostgresAdapter({
      enabled: config.provider === 'postgres',
    });
  }

  getAdapter() {
    if (this.config.mode === 'read_only' && this.config.provider === 'supabase') {
      return this.supabaseAdapter;
    }
    if (this.config.mode === 'read_only' && this.config.provider === 'postgres') {
      return this.postgresAdapter;
    }
    return this.mockAdapter;
  }

  async health() {
    const adapter = this.getAdapter();
    if (adapter.health) return adapter.health();
    return {
      connected: true,
      provider: 'mock',
      status: 'available',
    };
  }
}

module.exports = {
  DatabaseClient,
};
