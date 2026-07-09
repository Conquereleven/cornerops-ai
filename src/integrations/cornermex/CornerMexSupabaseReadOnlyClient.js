class CornerMexSupabaseReadOnlyClient {
  constructor({ supabaseClient } = {}) {
    this.supabaseClient = supabaseClient;
  }

  async selectRows({ table, limit, signal }) {
    if (!this.supabaseClient) {
      return { data: [], error: { message: 'Supabase client is not configured.' } };
    }
    let query = this.supabaseClient.from(table).select('*').limit(limit);
    if (signal && typeof query.abortSignal === 'function') {
      query = query.abortSignal(signal);
    }
    return query;
  }

  async countRows({ table, signal }) {
    if (!this.supabaseClient) {
      return { count: 0, error: { message: 'Supabase client is not configured.' } };
    }
    let query = this.supabaseClient.from(table).select('*', { count: 'exact', head: true });
    if (signal && typeof query.abortSignal === 'function') {
      query = query.abortSignal(signal);
    }
    return query;
  }
}

module.exports = { CornerMexSupabaseReadOnlyClient };
