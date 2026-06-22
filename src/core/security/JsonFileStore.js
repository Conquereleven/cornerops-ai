const fs = require('fs/promises');
const path = require('path');
const { FsSafeBoundary } = require('../native-tools/FsSafeBoundary');

class JsonFileStore {
  constructor({ filePath, initialData, root = './.cornerops' } = {}) {
    this.boundary = new FsSafeBoundary({ root, allowOutsideRoot: false, enabled: true });
    const absolute = path.resolve(process.cwd(), filePath);
    this.filePath = this.boundary.resolve(path.relative(this.boundary.root, absolute));
    this.initialData = initialData;
    this.queue = Promise.resolve();
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    try {
      await fs.access(this.filePath);
    } catch (_error) {
      await this.writeFile(this.initialData);
    }
    return this.readFile();
  }

  async readFile() {
    const raw = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(raw);
  }

  async writeFile(data) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temporary = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, this.filePath);
  }

  transact(mutator) {
    const operation = this.queue.then(async () => {
      const current = await this.initialize();
      const transaction = await mutator(current);
      await this.writeFile(transaction.data);
      return transaction.result;
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  async health() {
    try {
      await this.initialize();
      return { healthy: true, provider: 'file', path: this.filePath };
    } catch (error) {
      return { healthy: false, provider: 'file', path: this.filePath, errorCode: error.code || 'FILE_STORE_ERROR' };
    }
  }
}

module.exports = { JsonFileStore };
