const BLOCKED_KEYWORDS = [
  'alter',
  'call',
  'copy',
  'create',
  'delete',
  'do',
  'drop',
  'execute',
  'grant',
  'insert',
  'lock',
  'merge',
  'refresh',
  'reindex',
  'replace',
  'revoke',
  'truncate',
  'update',
  'vacuum',
];

const stripCommentsAndStrings = (query) => String(query || '')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/--[^\n\r]*/g, ' ')
  .replace(/'(?:''|[^'])*'/g, "''")
  .trim();

class DatabaseSafetyPolicy {
  constructor({
    allowWrites = false,
    auditReads = true,
    failClosed = true,
    maxRows = 100,
    queryTimeoutMs = 10000,
    readOnly = true,
  } = {}) {
    this.allowWrites = Boolean(allowWrites);
    this.auditReads = Boolean(auditReads);
    this.failClosed = Boolean(failClosed);
    this.maxRows = Math.max(1, Math.min(Number(maxRows) || 100, 1000));
    this.queryTimeoutMs = Math.max(100, Math.min(Number(queryTimeoutMs) || 10000, 30000));
    this.readOnly = readOnly !== false;
  }

  evaluate(query) {
    const normalized = stripCommentsAndStrings(query).toLowerCase();
    const deny = (reason, code) => ({ allowed: false, readOnly: true, reason, code });
    if (!this.readOnly || this.allowWrites) {
      return deny('Database write capability must remain disabled in v0.4.', 'DB_WRITES_NOT_BLOCKED');
    }
    if (!normalized) return deny('Empty or unknown queries are denied.', 'DB_QUERY_UNKNOWN');
    const statements = normalized.split(';').filter((statement) => statement.trim());
    if (statements.length !== 1) return deny('Multiple SQL statements are denied.', 'DB_MULTIPLE_STATEMENTS');
    if (!/^select\b/.test(statements[0])) {
      return deny('Only explicit SELECT statements are allowed.', 'DB_QUERY_NOT_SELECT');
    }
    const blocked = BLOCKED_KEYWORDS.find((keyword) =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(statements[0]));
    if (blocked) return deny(`Blocked SQL keyword: ${blocked}.`, 'DB_WRITE_KEYWORD_BLOCKED');
    if (/\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i.test(statements[0])) {
      return deny('Locking SELECT statements are denied.', 'DB_LOCKING_SELECT_BLOCKED');
    }
    if (/\bpg_(sleep|terminate_backend|cancel_backend)\b/i.test(statements[0])) {
      return deny('Unsafe database functions are denied.', 'DB_UNSAFE_FUNCTION_BLOCKED');
    }
    return {
      allowed: true,
      readOnly: true,
      reason: 'Explicit read-only SELECT allowed.',
      code: 'DB_SELECT_ALLOWED',
      maxRows: this.maxRows,
      queryTimeoutMs: this.queryTimeoutMs,
    };
  }

  assertReadOnly(query) {
    const decision = this.evaluate(query);
    if (!decision.allowed) {
      const error = new Error(decision.reason);
      error.code = decision.code;
      throw error;
    }
    return decision;
  }
}

module.exports = {
  BLOCKED_KEYWORDS,
  DatabaseSafetyPolicy,
  stripCommentsAndStrings,
};
