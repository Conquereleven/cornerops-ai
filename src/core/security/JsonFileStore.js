const path = require('path');
const env = require('../../config/env');
const { FileJsonStore } = require('../persistence/FileJsonStore');

class JsonFileStore extends FileJsonStore {
  constructor({ filePath, initialData, root = './.cornerops' } = {}) {
    const absoluteRoot = path.resolve(process.cwd(), root);
    const absoluteFile = path.resolve(process.cwd(), filePath);
    super({
      atomicWrites: env.corneropsFileStoreAtomicWrites,
      critical: true,
      failClosed: env.corneropsPersistenceFailClosed,
      filePath: path.relative(absoluteRoot, absoluteFile),
      initialData,
      maxBytes: env.corneropsFileStoreMaxBytes,
      root: absoluteRoot,
    });
  }
}

module.exports = { JsonFileStore };
