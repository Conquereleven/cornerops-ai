const fs = require('fs');
const path = require('path');
const { FsSafeBoundary } = require('../native-tools/FsSafeBoundary');
const { sanitizePersistencePayload } = require('../security/SecuritySanitizer');
const { clone } = require('./InMemoryStore');
const { createStoreError } = require('./persistenceTypes');

class FileJsonStore {
  constructor({
    atomicWrites = true,
    critical = false,
    failClosed = true,
    filePath,
    initialData = { version: 1, records: [] },
    maxBytes = 5 * 1024 * 1024,
    root = './.cornerops/state',
    sanitizer = sanitizePersistencePayload,
  } = {}) {
    if (!filePath) throw createStoreError('File store path is required.', 'FILE_STORE_PATH_REQUIRED');
    this.boundary = new FsSafeBoundary({ root, allowOutsideRoot: false, enabled: true });
    this.filePath = this.boundary.resolve(filePath);
    this.initialData = clone(initialData);
    this.atomicWrites = atomicWrites;
    this.critical = critical;
    this.failClosed = failClosed;
    this.maxBytes = Math.max(1024, Number(maxBytes) || 5 * 1024 * 1024);
    this.sanitizer = sanitizer;
    this.locked = false;
  }

  initialize() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    fs.chmodSync(path.dirname(this.filePath), 0o700);
    if (!fs.existsSync(this.filePath)) this.writeFile(this.initialData);
    return this.readFile();
  }

  readFile() {
    try {
      const stats = fs.statSync(this.filePath);
      if (stats.size > this.maxBytes) {
        throw createStoreError('File store exceeds configured size limit.', 'FILE_STORE_MAX_BYTES');
      }
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw createStoreError('File store root must be an object.', 'FILE_STORE_INVALID_DATA');
      }
      for (const [key, expected] of Object.entries(this.initialData)) {
        const actual = parsed[key];
        const valid = Array.isArray(expected)
          ? Array.isArray(actual)
          : expected && typeof expected === 'object'
            ? actual && typeof actual === 'object' && !Array.isArray(actual)
            : typeof actual === typeof expected;
        if (!valid) {
          throw createStoreError('File store schema is invalid.', 'FILE_STORE_INVALID_DATA');
        }
      }
      return clone(parsed);
    } catch (error) {
      const normalized = error instanceof SyntaxError
        ? createStoreError('File store contains invalid JSON.', 'FILE_STORE_CORRUPT')
        : error;
      if (this.critical && this.failClosed) throw normalized;
      this.writeFile(this.initialData);
      return clone(this.initialData);
    }
  }

  writeFile(data) {
    const sanitized = this.sanitizer(clone(data));
    const serialized = `${JSON.stringify(sanitized, null, 2)}\n`;
    if (Buffer.byteLength(serialized, 'utf8') > this.maxBytes) {
      throw createStoreError('File store write exceeds configured size limit.', 'FILE_STORE_MAX_BYTES');
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    fs.chmodSync(path.dirname(this.filePath), 0o700);
    if (!this.atomicWrites) {
      fs.writeFileSync(this.filePath, serialized, { mode: 0o600 });
      fs.chmodSync(this.filePath, 0o600);
      return clone(sanitized);
    }
    const temporary = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    try {
      fs.writeFileSync(temporary, serialized, { mode: 0o600, flag: 'wx' });
      fs.renameSync(temporary, this.filePath);
      fs.chmodSync(this.filePath, 0o600);
    } catch (error) {
      try { fs.unlinkSync(temporary); } catch (_cleanupError) { /* best effort */ }
      throw error;
    }
    return clone(sanitized);
  }

  transact(mutator) {
    if (this.locked) throw createStoreError('Nested file store transaction blocked.', 'FILE_STORE_LOCKED');
    this.locked = true;
    try {
      const current = this.initialize();
      const transaction = mutator(current);
      if (!transaction || !Object.prototype.hasOwnProperty.call(transaction, 'data')) {
        throw createStoreError('Persistence transaction must return data.', 'STORE_TRANSACTION_INVALID');
      }
      this.writeFile(transaction.data);
      return clone(transaction.result);
    } finally {
      this.locked = false;
    }
  }

  clear() {
    return this.writeFile(this.initialData);
  }

  health() {
    try {
      this.initialize();
      return { healthy: true, provider: 'file_json' };
    } catch (error) {
      return { healthy: false, provider: 'file_json', errorCode: error.code || 'FILE_STORE_ERROR' };
    }
  }
}

module.exports = { FileJsonStore };
