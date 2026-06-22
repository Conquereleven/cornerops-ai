const { OPERATOR_CHANNEL_PROVIDERS } = require('./operatorChannelTypes');

class OperatorChannelRegistry {
  constructor(adapters = []) {
    this.adapters = new Map();
    adapters.forEach((adapter) => this.register(adapter));
  }

  register(adapter) {
    if (!adapter || !OPERATOR_CHANNEL_PROVIDERS.includes(adapter.provider)) {
      throw new Error('A supported operator channel adapter is required.');
    }
    this.adapters.set(adapter.provider, adapter);
    return adapter;
  }

  get(provider) {
    return this.adapters.get(provider);
  }

  has(provider) {
    return this.adapters.has(provider);
  }

  list() {
    return [...this.adapters.values()];
  }
}

module.exports = { OperatorChannelRegistry };
