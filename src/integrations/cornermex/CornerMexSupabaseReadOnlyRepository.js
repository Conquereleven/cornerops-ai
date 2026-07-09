const { randomUUID } = require('crypto');
const { sanitizeValue } = require('../../core/security/SecuritySanitizer');
const { maskPii } = require('../lovable/LovableCornerMexConnector');
const {
  DEFAULT_READ_VIEW_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
} = require('./CornerMexSupabaseReadOnlyConfig');

const ENTITY_NAMES = Object.freeze(['products', 'leads', 'quotes', 'orders', 'customers', 'payments', 'fulfillment']);
const SUCCESSFUL_AVAILABILITY = Object.freeze([
  TABLE_AVAILABILITY.AVAILABLE,
  TABLE_AVAILABILITY.AVAILABLE_EMPTY,
  TABLE_AVAILABILITY.AVAILABLE_MASKED,
]);

const nowIso = () => new Date().toISOString();
const auditId = (prefix = 'audit-cornermex-supabase') => `${prefix}-${randomUUID().slice(0, 12)}`;

const sanitizeErrorMessage = (error) => String(error?.message || error?.code || 'unknown_error')
  .replace(/https:\/\/[^\s)]+/g, '[redacted-url]')
  .replace(/eyJ[A-Za-z0-9._-]+/g, '[redacted-jwt]')
  .slice(0, 180);

const classifyError = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  if (/timeout|aborted|abort/.test(text)) return TABLE_AVAILABILITY.TIMEOUT;
  if (/42p01|pgrst205|does not exist|not found|schema cache/.test(text)) return TABLE_AVAILABILITY.MISSING_TABLE;
  if (/42501|permission|rls|row-level|violates row-level|not authorized/.test(text)) return TABLE_AVAILABILITY.RLS_BLOCKED;
  return TABLE_AVAILABILITY.ERROR_SANITIZED;
};

const withTimeout = async (promise, timeoutMs) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(Object.assign(new Error('read_timeout'), { code: 'READ_TIMEOUT' })), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
};

class CornerMexSupabaseReadOnlyRepository {
  constructor({
    auditLogService,
    client,
    configSummary,
  } = {}) {
    this.auditLogService = auditLogService;
    this.client = client;
    this.configSummary = configSummary;
  }

  async checkReadiness(context = {}) {
    const validation = this.configSummary.validate();
    if (validation.unsafe.length) return this.statusFromValidation(validation, SUPABASE_STATUS.BLOCKED, SOURCE_MODES.BLOCKED_UNSAFE_CONFIG);
    if (!validation.activationCandidate || !this.client) {
      return this.statusFromValidation(validation, SUPABASE_STATUS.NOT_CONFIGURED, SOURCE_MODES.REPO_DISCOVERED);
    }
    const tableResults = {};
    for (const entity of ENTITY_NAMES) {
      tableResults[entity] = await this.readTable(entity, { limit: 1 }, context);
    }
    const availability = Object.fromEntries(
      Object.entries(tableResults).map(([entity, result]) => [entity, result.meta.availability]),
    );
    const rowCounts = {};
    for (const [entity, result] of Object.entries(tableResults)) {
      rowCounts[entity] = await this.countTable(entity, result.meta.table, result.meta.rowCount, validation, context);
    }
    const statuses = Object.values(availability);
    const successful = statuses.filter((status) => SUCCESSFUL_AVAILABILITY.includes(status));
    const failed = statuses.filter((status) => !SUCCESSFUL_AVAILABILITY.includes(status));
    const missingPublicReadModel = statuses.length > 0
      && statuses.every((status) => status === TABLE_AVAILABILITY.MISSING_TABLE);
    const sourceMode = successful.length && failed.length
      ? SOURCE_MODES.REAL_READ_ONLY_PARTIAL
      : successful.length ? SOURCE_MODES.REAL_READ_ONLY : SOURCE_MODES.REPO_DISCOVERED;
    const supabaseStatus = successful.length && failed.length
      ? SUPABASE_STATUS.PARTIAL
      : successful.length ? SUPABASE_STATUS.CONNECTED
        : missingPublicReadModel ? SUPABASE_STATUS.CONNECTED_NO_PUBLIC_READ_MODEL
          : SUPABASE_STATUS.ERROR_SANITIZED;
    const readModelStatus = missingPublicReadModel
      ? 'missing_public_read_model'
      : successful.length ? 'available' : 'unavailable';
    const actionRequired = missingPublicReadModel ? 'create_cornerops_readonly_views' : null;
    return {
      ...validation,
      sourceMode,
      supabaseStatus,
      readModelStatus,
      actionRequired,
      tableAvailability: availability,
      rowCounts,
      maskingApplied: validation.readOnlyFlags.maskingApplied,
      lastReadAt: nowIso(),
      auditId: await this.audit(context, 'readiness', { sourceMode, supabaseStatus, tableAvailability: availability }),
      warnings: [
        ...validation.warnings,
        ...Object.values(tableResults).flatMap((result) => result.meta.warnings || []),
      ],
    };
  }

  statusFromValidation(validation, supabaseStatus, sourceMode) {
    return {
      ...validation,
      sourceMode,
      supabaseStatus,
      tableAvailability: validation.tableAvailability,
      rowCounts: Object.fromEntries(Object.keys(validation.tableMappings).map((entity) => [entity, 0])),
      maskingApplied: validation.readOnlyFlags.maskingApplied,
      lastReadAt: null,
      auditId: auditId(),
    };
  }

  async listEntity(entity, filters = {}, context = {}) {
    const readiness = await this.checkReadiness(context);
    if (![SOURCE_MODES.REAL_READ_ONLY, SOURCE_MODES.REAL_READ_ONLY_PARTIAL].includes(readiness.sourceMode)) {
      return {
        data: [],
        meta: this.meta(entity, readiness, TABLE_AVAILABILITY.CONFIG_MISSING, 0, readiness.warnings),
      };
    }
    return this.readTable(entity, filters, context);
  }

  async getEntityById(entity, id, context = {}) {
    const result = await this.listEntity(entity, { limit: this.configSummary.validate().limits.maxRows }, context);
    const found = result.data.find((row) => String(row.id) === String(id)) || null;
    return {
      data: found,
      meta: { ...result.meta, rowCount: found ? 1 : 0 },
    };
  }

  async readTable(entity, filters = {}, context = {}) {
    const validation = this.configSummary.validate();
    const tables = validation.tableMappingCandidates?.[entity] || [validation.tableMappings[entity]];
    const limit = Math.max(1, Math.min(Number(filters.limit) || validation.limits.maxRows, validation.limits.maxRows));
    if (!tables.length || !this.client) {
      return { data: [], meta: this.meta(entity, validation, TABLE_AVAILABILITY.CONFIG_MISSING, 0, [`Missing table mapping for ${entity}.`]) };
    }
    const failures = [];
    let fallbackResult = null;
    for (const [index, table] of tables.entries()) {
      const result = await this.tryReadTable(entity, table, limit, validation, context);
      if (SUCCESSFUL_AVAILABILITY.includes(result.meta.availability)) {
        const shouldTryLegacyFallback = result.meta.availability === TABLE_AVAILABILITY.AVAILABLE_EMPTY
          && table === DEFAULT_READ_VIEW_TABLES[entity]
          && tables[index + 1];
        if (!shouldTryLegacyFallback) return result;
      }
      failures.push(...(result.meta.warnings || []));
      if (!fallbackResult || result.meta.availability !== TABLE_AVAILABILITY.MISSING_TABLE) fallbackResult = result;
    }
    return {
      data: [],
      meta: {
        ...(fallbackResult?.meta || this.meta(entity, validation, TABLE_AVAILABILITY.ERROR_SANITIZED, 0, [])),
        table: tables[0],
        attemptedTables: tables,
        warnings: [...new Set(failures)],
      },
    };
  }

  async countTable(entity, table, fallbackCount, validation, context = {}) {
    if (!table || !this.client?.countRows) return fallbackCount;
    try {
      const response = await withTimeout(
        this.client.countRows({ table }),
        validation.limits.requestTimeoutMs,
      );
      if (response.error) return fallbackCount;
      const count = Number(response.count);
      if (!Number.isFinite(count)) return fallbackCount;
      await this.audit(context, `count_${entity}`, { table, rowCount: count });
      return count;
    } catch (_error) {
      return fallbackCount;
    }
  }

  async tryReadTable(entity, table, limit, validation, context = {}) {
    try {
      const response = await withTimeout(
        this.client.selectRows({ table, limit }),
        validation.limits.requestTimeoutMs,
      );
      if (response.error) {
        const availability = classifyError(response.error);
        return { data: [], meta: this.meta(entity, validation, availability, 0, [`Supabase read failed safely for ${entity}: ${sanitizeErrorMessage(response.error)}`]) };
      }
      const rawRows = Array.isArray(response.data) ? response.data.slice(0, limit) : [];
      const rows = rawRows.map((row) => (validation.readOnlyFlags.maskingApplied ? maskPii(sanitizeValue(row)) : sanitizeValue(row)));
      const availability = rows.length === 0
        ? TABLE_AVAILABILITY.AVAILABLE_EMPTY
        : validation.readOnlyFlags.maskingApplied ? TABLE_AVAILABILITY.AVAILABLE_MASKED : TABLE_AVAILABILITY.AVAILABLE;
      const readAuditId = await this.audit(context, `list_${entity}`, { table, rowCount: rows.length, availability });
      return {
        data: rows,
        meta: {
          ...this.meta(entity, validation, availability, rows.length, []),
          auditId: readAuditId,
          lastReadAt: nowIso(),
        },
      };
    } catch (error) {
      const availability = classifyError(error);
      return { data: [], meta: this.meta(entity, validation, availability, 0, [`Supabase read failed safely for ${entity}: ${sanitizeErrorMessage(error)}`]) };
    }
  }

  meta(entity, status, availability, rowCount, warnings = []) {
    const successful = SUCCESSFUL_AVAILABILITY.includes(availability);
    return {
      source: successful ? SOURCE_MODES.REAL_READ_ONLY : status.sourceMode || SOURCE_MODES.REPO_DISCOVERED,
      dataSource: successful ? 'cornermex_supabase' : 'mock_fallback',
      supabaseStatus: successful ? SUPABASE_STATUS.CONNECTED : status.supabaseStatus || SUPABASE_STATUS.ERROR_SANITIZED,
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      maskingApplied: status.readOnlyFlags?.maskingApplied !== false,
      table: status.tableMappings?.[entity] || null,
      availability,
      rowCount,
      tableAvailability: { [entity]: availability },
      mappingConfidence: successful ? 'high' : 'medium',
      lastReadAt: successful ? nowIso() : null,
      auditId: auditId(),
      warnings: [...new Set(warnings.filter(Boolean))],
    };
  }

  async audit(context, operation, details) {
    if (this.configSummary.validate().readOnlyFlags.auditReads === false) return auditId();
    const event = await this.auditLogService?.record?.({
      ...context,
      eventType: 'cornermex_supabase_read',
      dataSource: 'cornermex_supabase',
      operation,
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: details,
    });
    return event?.id || auditId();
  }
}

module.exports = {
  CornerMexSupabaseReadOnlyRepository,
  ENTITY_NAMES,
  classifyError,
  sanitizeErrorMessage,
};
