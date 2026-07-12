const { INTERNAL_TABLES, createWorkQueueError } = require('./workQueueTypes');

class InternalWriteBoundary {
  constructor({ schema = 'cornerops_internal', tables = INTERNAL_TABLES } = {}) {
    if (schema !== 'cornerops_internal') {
      throw createWorkQueueError('Internal persistence schema is not allowed.', 'INTERNAL_SCHEMA_DENIED', 503);
    }
    this.schema = schema;
    this.tables = new Set(tables);
  }

  assertTable(table) {
    if (!this.tables.has(table)) {
      throw createWorkQueueError(
        'Write target is outside the CornerOps internal allowlist.',
        'INTERNAL_WRITE_TARGET_DENIED',
        403,
      );
    }
    return `${this.schema}.${table}`;
  }
}

module.exports = { InternalWriteBoundary };
