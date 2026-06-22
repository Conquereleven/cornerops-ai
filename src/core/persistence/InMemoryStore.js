const { createStoreError } = require('./persistenceTypes');

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

class InMemoryStore {
  constructor({ initialData = { version: 1, records: [] }, sanitizer = (value) => value } = {}) {
    this.initialData = clone(initialData);
    this.sanitizer = sanitizer;
    this.data = clone(initialData);
  }

  initialize() {
    return this.readFile();
  }

  readFile() {
    return clone(this.data);
  }

  writeFile(data) {
    this.data = clone(this.sanitizer(data));
    return this.readFile();
  }

  transact(mutator) {
    const transaction = mutator(this.readFile());
    if (!transaction || !Object.prototype.hasOwnProperty.call(transaction, 'data')) {
      throw createStoreError('Persistence transaction must return data.', 'STORE_TRANSACTION_INVALID');
    }
    this.writeFile(transaction.data);
    return clone(transaction.result);
  }

  clear() {
    return this.writeFile(this.initialData);
  }

  health() {
    return { healthy: true, provider: 'memory' };
  }
}

module.exports = { InMemoryStore, clone };
