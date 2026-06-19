const { sanitizeValue } = require('../../core/security/SecuritySanitizer');
const { DatabaseSafetyPolicy } = require('./DatabaseSafetyPolicy');

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TABLE_LOADERS = {
  leads: 'listLeads',
  quotes: 'listQuotes',
  orders: 'listOrders',
  audit_logs: 'listAuditLogs',
  approvals: 'listApprovals',
};

const maskPersonName = (value) => {
  const text = String(value || '').trim();
  return text ? `${text.slice(0, 1)}***` : text;
};

const sanitizeBusinessPii = (value, key = '') => {
  const normalizedKey = String(key).replace(/[^a-z]/gi, '').toLowerCase();
  if (['contactname', 'customername', 'fullname'].includes(normalizedKey)) return maskPersonName(value);
  if (['address', 'internalnotes', 'notes'].includes(normalizedKey)) return '[REDACTED_PII]';
  if (Array.isArray(value)) return value.map((item) => sanitizeBusinessPii(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [
    entryKey,
    sanitizeBusinessPii(entryValue, entryKey),
  ]));
};

const withTimeout = async (operation, timeoutMs) => {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(`Database query exceeded ${timeoutMs}ms.`);
          error.code = 'DB_QUERY_TIMEOUT';
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

class ReadOnlyDatabaseAdapter {
  constructor({
    auditLogService,
    config = {},
    mockAdapter,
    postgresQuery,
    safetyPolicy,
    supabaseClient,
  } = {}) {
    this.auditLogService = auditLogService;
    this.config = {
      auditReads: config.auditReads !== false,
      businessDataEnabled: Boolean(config.businessDataEnabled),
      dryRun: config.dryRun !== false,
      maxRows: Math.max(1, Math.min(Number(config.maxRows) || 100, 1000)),
      mode: config.mode || 'read_only',
      piiMasking: config.piiMasking !== false,
      provider: config.provider || 'mock',
      queryTimeoutMs: Math.max(100, Math.min(Number(config.queryTimeoutMs) || 10000, 30000)),
      readOnly: config.readOnly !== false,
      allowWrites: Boolean(config.allowWrites),
      schema: config.schema || 'public',
      credentialsAvailable: Boolean(config.credentialsAvailable),
    };
    this.mockAdapter = mockAdapter;
    this.postgresQuery = postgresQuery;
    this.supabaseClient = supabaseClient;
    this.safetyPolicy = safetyPolicy || new DatabaseSafetyPolicy({
      allowWrites: this.config.allowWrites,
      auditReads: this.config.auditReads,
      maxRows: this.config.maxRows,
      queryTimeoutMs: this.config.queryTimeoutMs,
      readOnly: this.config.readOnly,
    });
  }

  isRealReadOnlyReady() {
    const providerReady = (this.config.provider === 'supabase' && this.supabaseClient)
      || (this.config.provider === 'postgres' && this.postgresQuery);
    return Boolean(
      this.config.businessDataEnabled
      && !this.config.dryRun
      && this.config.mode === 'read_only'
      && this.config.readOnly
      && !this.config.allowWrites
      && this.config.credentialsAvailable
      && providerReady,
    );
  }

  getSourceMode() {
    return this.isRealReadOnlyReady() ? 'real_read_only' : 'mock';
  }

  async health() {
    const realReady = this.isRealReadOnlyReady();
    const warnings = [];
    if (!this.config.businessDataEnabled) warnings.push('Business data onboarding is disabled.');
    if (this.config.businessDataEnabled && !this.config.credentialsAvailable) {
      warnings.push('Read-only database credentials are missing.');
    }
    if (!this.config.readOnly || this.config.allowWrites) {
      warnings.push('CRITICAL: database write protection is not enforced.');
    }
    return {
      connected: realReady || Boolean(this.mockAdapter),
      provider: realReady ? this.config.provider : 'mock',
      configuredProvider: this.config.provider,
      mode: this.getSourceMode(),
      readOnlyVerified: this.config.readOnly && !this.config.allowWrites && (realReady || Boolean(this.mockAdapter)),
      status: realReady ? 'available' : (this.mockAdapter ? 'mock_available' : 'degraded'),
      warnings,
    };
  }

  validateIdentifier(value, label) {
    if (!IDENTIFIER.test(String(value || ''))) {
      const error = new Error(`Unsafe ${label} identifier denied.`);
      error.code = 'DB_IDENTIFIER_DENIED';
      throw error;
    }
    return value;
  }

  async audit(context, operation, details, status = 'success', error) {
    if (!this.config.auditReads) return null;
    if (!this.auditLogService?.record) {
      const auditError = new Error('Database reads require an available audit service.');
      auditError.code = 'DB_AUDIT_REQUIRED';
      throw auditError;
    }
    return this.auditLogService.record({
      ...context,
      eventType: 'database_read',
      dataSource: 'business_database',
      operation,
      policyDecision: status === 'denied' ? 'denied' : 'allowed',
      status,
      input: details,
      errorCode: error?.code,
      errorMessage: error?.message,
    });
  }

  sanitizeRows(rows) {
    return this.config.piiMasking ? sanitizeBusinessPii(sanitizeValue(rows)) : rows;
  }

  async select({ table, columns = ['*'], filters = {}, limit } = {}, context = {}) {
    const safeTable = this.validateIdentifier(table, 'table');
    const safeColumns = columns.map((column) =>
      column === '*' ? column : this.validateIdentifier(column, 'column'));
    const safeFilters = Object.fromEntries(Object.entries(filters).map(([key, value]) => [
      this.validateIdentifier(key, 'filter column'),
      value,
    ]));
    const rowLimit = Math.max(1, Math.min(Number(limit) || this.config.maxRows, this.config.maxRows));
    const query = `SELECT ${safeColumns.join(', ')} FROM ${safeTable} LIMIT ${rowLimit}`;
    const decision = this.safetyPolicy.evaluate(query);
    if (!decision.allowed) {
      await this.audit(context, 'select', { table: safeTable, rowLimit }, 'denied');
      const error = new Error(decision.reason);
      error.code = decision.code;
      throw error;
    }
    try {
      const rows = await withTimeout(
        () => this.isRealReadOnlyReady()
          ? this.selectReal({ table: safeTable, columns: safeColumns, filters: safeFilters, limit: rowLimit })
          : this.selectMock({ table: safeTable, filters: safeFilters, limit: rowLimit }),
        this.config.queryTimeoutMs,
      );
      const sanitized = this.sanitizeRows(rows);
      await this.audit(context, 'select', {
        table: safeTable,
        columns: safeColumns,
        filters: Object.keys(safeFilters),
        rowCount: sanitized.length,
        source: this.getSourceMode(),
      });
      return {
        rows: sanitized,
        source: this.getSourceMode(),
        readOnly: true,
        truncated: rows.length >= rowLimit,
      };
    } catch (error) {
      await this.audit(context, 'select', { table: safeTable, rowLimit }, 'error', error);
      throw error;
    }
  }

  async selectReal({ table, columns, filters, limit }) {
    if (this.config.provider === 'supabase') {
      let query = this.supabaseClient
        .schema(this.config.schema)
        .from(table)
        .select(columns.join(','))
        .limit(limit);
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query;
      if (error) {
        const dbError = new Error(error.message || 'Supabase read failed.');
        dbError.code = 'SUPABASE_READ_FAILED';
        throw dbError;
      }
      return Array.isArray(data) ? data : [];
    }
    if (this.config.provider === 'postgres') {
      const filterEntries = Object.entries(filters);
      const where = filterEntries.length
        ? ` WHERE ${filterEntries.map(([key], index) => `"${key}" = $${index + 1}`).join(' AND ')}`
        : '';
      const sql = `SELECT ${columns.map((column) => column === '*' ? '*' : `"${column}"`).join(', ')} FROM "${this.config.schema}"."${table}"${where} LIMIT ${limit}`;
      this.safetyPolicy.assertReadOnly(sql);
      const result = await this.postgresQuery(sql, filterEntries.map(([, value]) => value), {
        readOnly: true,
        timeoutMs: this.config.queryTimeoutMs,
      });
      return Array.isArray(result) ? result : (result?.rows || []);
    }
    throw Object.assign(new Error('Unknown database provider denied.'), { code: 'DB_PROVIDER_UNKNOWN' });
  }

  selectMock({ table, filters, limit }) {
    const loader = TABLE_LOADERS[table];
    if (!loader || !this.mockAdapter?.[loader]) {
      const error = new Error(`Mock table is not allowlisted: ${table}.`);
      error.code = 'DB_MOCK_TABLE_DENIED';
      throw error;
    }
    return this.mockAdapter[loader]()
      .filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value))
      .slice(0, limit);
  }
}

module.exports = {
  IDENTIFIER,
  ReadOnlyDatabaseAdapter,
  TABLE_LOADERS,
  maskPersonName,
  sanitizeBusinessPii,
  withTimeout,
};
