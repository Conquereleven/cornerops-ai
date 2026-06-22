class SupabaseAdapter {
  constructor({ enabled = false } = {}) {
    this.enabled = enabled;
  }

  async health() {
    return {
      connected: false,
      provider: 'supabase',
      status: this.enabled ? 'not_configured' : 'disabled',
      note: 'Supabase read adapter is reserved for a later migration; mock data remains source for v0.1.',
    };
  }
}

module.exports = {
  SupabaseAdapter,
};
