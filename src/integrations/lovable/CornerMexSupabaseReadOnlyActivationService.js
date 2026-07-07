const { sanitizeValue } = require('../../core/security/SecuritySanitizer');
const { maskPii } = require('./LovableCornerMexConnector');
const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');
const {
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
} = require('../cornermex');

const ENTITY_TABLES = Object.freeze({
  products: 'products',
  leads: 'b2b_leads',
  quotes: 'b2b_leads',
  orders: 'orders',
  customers: 'profiles',
});

class CornerMexSupabaseReadOnlyActivationService {
  constructor({
    auditLogService,
    config = {},
    migrationDiscoveryService,
    repository,
    supabaseClient,
    validator,
  } = {}) {
    this.auditLogService = auditLogService;
    this.config = config;
    this.migrationDiscoveryService = migrationDiscoveryService;
    this.repository = repository;
    this.supabaseClient = supabaseClient;
    this.validator = validator;
  }

  async getStatus(context = {}) {
    const validation = this.validator.validate();
    const migrationDiscovery = this.migrationDiscoveryService?.discover
      ? await this.migrationDiscoveryService.discover()
      : null;
    const repositoryStatus = this.repository?.checkReadiness
      ? await this.repository.checkReadiness(context)
      : null;
    const mode = repositoryStatus?.sourceMode === SOURCE_MODES.REAL_READ_ONLY
      ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY
      : repositoryStatus?.sourceMode === SOURCE_MODES.REAL_READ_ONLY_PARTIAL
        ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL
      : validation.status === LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
        ? LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
        : migrationDiscovery?.mode === LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
          ? LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
          : LOVABLE_SOURCE_MODES.REPO_DISCOVERED;
    const status = {
      mode,
      validation,
      liveSchemaDiscoveryStatus: validation.schemaDiscoveryEnabled && mode === LOVABLE_SOURCE_MODES.REAL_READ_ONLY
        ? 'enabled_read_only'
        : 'disabled',
      tables: migrationDiscovery?.tables || [],
      mappedEntities: Object.keys(ENTITY_TABLES),
      supabaseStatus: repositoryStatus?.supabaseStatus || (
        validation.unsafe.length ? SUPABASE_STATUS.BLOCKED : SUPABASE_STATUS.NOT_CONFIGURED
      ),
      readModelStatus: repositoryStatus?.readModelStatus || 'unknown',
      actionRequired: repositoryStatus?.actionRequired || null,
      tableAvailability: repositoryStatus?.tableAvailability || Object.fromEntries(
        Object.keys(ENTITY_TABLES).map((entity) => [entity, TABLE_AVAILABILITY.CONFIG_MISSING]),
      ),
      rowCounts: repositoryStatus?.rowCounts || Object.fromEntries(
        Object.keys(ENTITY_TABLES).map((entity) => [entity, 0]),
      ),
      maskingApplied: repositoryStatus?.maskingApplied ?? validation.readOnlyFlags.piiMasking,
      lastReadAt: repositoryStatus?.lastReadAt || null,
      auditId: repositoryStatus?.auditId || null,
      warnings: [
        ...validation.unsafe,
        ...(validation.missing.length ? [`Missing Supabase config: ${validation.missing.join(', ')}`] : []),
        ...(repositoryStatus?.warnings || []),
        ...(validation.schemaDiscoveryEnabled ? [] : ['Live schema discovery is disabled; using migration map.']),
      ],
    };
    await this.audit(context, 'status', { mode, missing: validation.missing });
    return status;
  }

  async listEntity(entity, filters = {}, context = {}) {
    const status = await this.getStatus(context);
    const table = ENTITY_TABLES[entity];
    const limit = Math.max(1, Math.min(Number(filters.limit) || status.validation.limits.maxRows, status.validation.limits.maxRows));
    if (
      [LOVABLE_SOURCE_MODES.REAL_READ_ONLY, LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL].includes(status.mode)
      && this.repository?.listEntity
      && table
    ) {
      return this.repository.listEntity(entity, { ...filters, limit }, context);
    }
    if (status.mode !== LOVABLE_SOURCE_MODES.REAL_READ_ONLY || !this.supabaseClient || !table) {
      return {
        data: [],
        meta: {
          source: status.mode,
          dataSource: 'mock_fallback',
          supabaseStatus: status.supabaseStatus,
          tableAvailability: status.tableAvailability,
          maskingApplied: status.maskingApplied,
          auditId: status.auditId,
          lastReadAt: status.lastReadAt,
          readOnly: true,
          writesBlocked: true,
          externalSendsBlocked: true,
          rowCount: 0,
          table: table || null,
          mappingConfidence: status.mode === LOVABLE_SOURCE_MODES.REAL_READ_ONLY ? 'high' : 'medium',
          warnings: table ? status.warnings : [`No mapped Supabase table for entity ${entity}.`],
        },
      };
    }

    const query = this.supabaseClient.from(table).select('*').limit(limit);
    const { data, error } = await query;
    if (error) {
      return {
        data: [],
        meta: {
          source: LOVABLE_SOURCE_MODES.REAL_READ_ONLY,
          readOnly: true,
          rowCount: 0,
          table,
          mappingConfidence: 'high',
          warnings: [`Supabase read failed safely: ${error.message || 'unknown error'}`],
        },
      };
    }
    const rows = (Array.isArray(data) ? data : [])
      .slice(0, limit)
      .map((row) => this.config.cornermexSupabasePiiMasking === false ? sanitizeValue(row) : maskPii(sanitizeValue(row)));
    await this.audit(context, `list_${entity}`, { sourceMode: LOVABLE_SOURCE_MODES.REAL_READ_ONLY, table, rowCount: rows.length });
    return {
      data: rows,
      meta: {
        source: LOVABLE_SOURCE_MODES.REAL_READ_ONLY,
        dataSource: 'cornermex_supabase',
        supabaseStatus: SUPABASE_STATUS.CONNECTED,
        tableAvailability: { [entity]: rows.length ? TABLE_AVAILABILITY.AVAILABLE_MASKED : TABLE_AVAILABILITY.AVAILABLE_EMPTY },
        maskingApplied: this.config.cornermexSupabasePiiMasking !== false,
        auditId: null,
        lastReadAt: new Date().toISOString(),
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        rowCount: rows.length,
        table,
        mappingConfidence: 'high',
        warnings: [],
      },
    };
  }

  async getEntityById(entity, id, context = {}) {
    const result = await this.listEntity(entity, { limit: this.config.cornermexSupabaseMaxRows || 100 }, context);
    return {
      ...result,
      data: result.data.find((row) => String(row.id) === String(id)) || null,
      meta: {
        ...result.meta,
        rowCount: result.data.find((row) => String(row.id) === String(id)) ? 1 : 0,
      },
    };
  }

  async audit(context, operation, details) {
    if (this.config.cornermexSupabaseAuditReads === false) return null;
    return this.auditLogService?.record?.({
      ...context,
      eventType: 'cornermex_supabase_read',
      dataSource: 'cornermex_supabase',
      operation,
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: details,
    });
  }
}

module.exports = { CornerMexSupabaseReadOnlyActivationService, ENTITY_TABLES };
