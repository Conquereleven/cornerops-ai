class RateLimitStore {
  constructor() {
    this.states = {};
  }

  async update(key, updater) {
    const next = updater(this.states[key]);
    this.states[key] = next.state;
    return next.result;
  }

  async health() {
    return { healthy: true, provider: 'memory' };
  }
}

module.exports = { RateLimitStore };
