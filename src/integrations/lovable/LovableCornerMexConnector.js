const fs = require('fs');
const path = require('path');
const { sanitizeValue } = require('../../core/security/SecuritySanitizer');
const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'));

const maskPii = (item) => {
  if (!item || typeof item !== 'object') return item;
  const copy = { ...item };
  ['name', 'contactName', 'contact_name', 'customerName', 'customer_name'].forEach((key) => {
    if (copy[key]) copy[key] = `${String(copy[key]).slice(0, 1)}***`;
  });
  ['email'].forEach((key) => {
    if (copy[key]) copy[key] = 'masked@example.test';
  });
  ['phone', 'whatsapp', 'mobile', 'contactPhone', 'contact_phone'].forEach((key) => {
    if (copy[key]) copy[key] = String(copy[key]).replace(/\d(?=\d{2})/g, '*');
  });
  ['address', 'shippingAddress', 'shipping_address', 'deliveryAddress', 'delivery_address'].forEach((key) => {
    if (copy[key]) copy[key] = '[masked-address]';
  });
  return copy;
};

class LovableCornerMexConnector {
  constructor({
    auditLogService,
    contractRegistry,
    discoveryService,
    supabaseReadOnlyActivationService,
    config = {},
  } = {}) {
    this.auditLogService = auditLogService;
    this.contractRegistry = contractRegistry;
    this.discoveryService = discoveryService;
    this.supabaseReadOnlyActivationService = supabaseReadOnlyActivationService;
    this.config = {
      auditReads: config.corneropsCornermexConnectorAuditReads !== false,
      enabled: Boolean(config.corneropsCornermexConnectorEnabled),
      mode: config.corneropsCornermexConnectorMode || 'mock',
      piiMasking: config.corneropsCornermexConnectorPiiMasking !== false,
      maxRows: Math.max(1, Math.min(Number(config.cornermexSupabaseMaxRows) || 100, 1000)),
      queryTimeoutMs: Math.max(100, Math.min(Number(config.cornermexSupabaseQueryTimeoutMs) || 10000, 30000)),
      lovableRepoConfigured: Boolean(config.cornermexLovableGithubRepo),
      supabaseConfigured: Boolean(config.cornermexSupabaseEnabled && config.cornermexSupabaseUrl && config.cornermexSupabaseAnonKey),
      supabaseReadOnly: config.cornermexSupabaseReadOnly !== false,
      supabaseAllowWrites: Boolean(config.cornermexSupabaseAllowWrites),
      supabaseBlockMutations: config.cornermexSupabaseBlockMutations !== false,
      supabaseServiceRoleKeyBlocked: config.cornermexSupabaseServiceRoleKeyBlocked !== false,
    };
  }

  getSourceMode(discovery = null) {
    if (this.config.supabaseAllowWrites || !this.config.supabaseReadOnly || !this.config.supabaseBlockMutations || !this.config.supabaseServiceRoleKeyBlocked) {
      return LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG;
    }
    if (this.config.lovableRepoConfigured) return LOVABLE_SOURCE_MODES.REPO_DISCOVERED;
    if (this.config.supabaseConfigured) return LOVABLE_SOURCE_MODES.REPO_DISCOVERED;
    return LOVABLE_SOURCE_MODES.MOCK;
  }

  async getConnectorStatus(context = {}) {
    const discovery = await this.discoveryService.discover();
    const supabaseReadOnlyStatus = this.supabaseReadOnlyActivationService?.getStatus
      ? await this.supabaseReadOnlyActivationService.getStatus(context)
      : null;
    const discoveredSourceMode = this.getSourceMode(discovery);
    const sourceMode = [
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY,
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL,
      LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG,
    ].includes(supabaseReadOnlyStatus?.mode)
      ? supabaseReadOnlyStatus.mode
      : discoveredSourceMode;
    const schemaEvidence = discovery.supabase?.migrationDiscovery?.schemaEvidence || [];
    const contractSourceMode = sourceMode === LOVABLE_SOURCE_MODES.REPO_DISCOVERED && schemaEvidence.length
      ? LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
      : [
      LOVABLE_SOURCE_MODES.REPO_DISCOVERED,
      LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED,
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY,
      LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG,
    ].includes(sourceMode)
        ? sourceMode
        : LOVABLE_SOURCE_MODES.MOCK;
    const contracts = this.contractRegistry.getSummary({
      sourceMode: contractSourceMode,
      sourceReference: sourceMode === LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
        ? 'lovable-repo-supabase-migrations'
        : sourceMode === LOVABLE_SOURCE_MODES.REPO_DISCOVERED ? 'lovable-connected-repo' : 'mock/template',
      schemaEvidence,
    });
    const warnings = [
      ...(discovery.warnings || []),
      ...(this.config.supabaseAllowWrites ? ['CRITICAL: CornerMex Supabase writes are enabled.'] : []),
      ...(this.config.supabaseBlockMutations ? [] : ['CRITICAL: CornerMex Supabase mutation blocking is disabled.']),
      ...(this.config.supabaseServiceRoleKeyBlocked ? [] : ['CRITICAL: CornerMex Supabase service role key blocking is disabled.']),
      ...(this.config.piiMasking ? [] : ['CRITICAL: CornerMex connector PII masking is disabled.']),
    ];
    const status = {
      enabled: this.config.enabled,
      discoveryMode: discovery.discoveryMode,
      sourceMode,
      projectConfigured: discovery.project.configured,
      githubRepoConfigured: discovery.repo.configured,
      supabaseConfigured: discovery.supabase.configured,
      dataSource: [LOVABLE_SOURCE_MODES.REAL_READ_ONLY, LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL].includes(sourceMode)
        ? 'cornermex_supabase'
        : sourceMode === LOVABLE_SOURCE_MODES.REPO_DISCOVERED
          ? 'lovable_repo_discovery'
          : 'mock_fallback',
      supabaseReadOnlyStatus,
      supabaseStatus: supabaseReadOnlyStatus?.supabaseStatus || 'not_configured',
      tableAvailability: supabaseReadOnlyStatus?.tableAvailability || {},
      rowCounts: supabaseReadOnlyStatus?.rowCounts || {},
      maskingApplied: supabaseReadOnlyStatus?.maskingApplied ?? this.config.piiMasking,
      lastReadAt: supabaseReadOnlyStatus?.lastReadAt || null,
      auditId: supabaseReadOnlyStatus?.auditId || null,
      discoveredEntities: discovery.entities,
      discoveredFlows: discovery.flows,
      mappedContracts: contracts.contracts.map((contract) => ({
        entity: contract.entity,
        confidence: contract.confidence,
        sourceMode: contract.sourceMode,
        missingFields: contract.missingFields,
        warnings: contract.warnings,
      })),
      contractConfidence: contracts.confidence,
      schemaDiscovery: {
        status: discovery.supabase?.migrationDiscovery?.mode || 'not_available',
        migrationFileCount: discovery.supabase?.migrationDiscovery?.migrationFileCount || 0,
        tables: discovery.supabase?.migrationDiscovery?.tables || [],
        contracts: discovery.supabase?.migrationDiscovery?.contracts || [],
        piiCandidateFields: discovery.supabase?.migrationDiscovery?.piiCandidateFields || [],
        rlsPoliciesDiscovered: discovery.supabase?.migrationDiscovery?.rlsPoliciesDiscovered || [],
        writeRiskSql: discovery.supabase?.migrationDiscovery?.writeRiskSql || [],
      },
      piiMasking: this.config.piiMasking,
      writesBlocked: !this.config.supabaseAllowWrites && this.config.supabaseReadOnly && this.config.supabaseBlockMutations && this.config.supabaseServiceRoleKeyBlocked,
      lastReadAuditStatus: this.config.auditReads ? 'enabled' : 'disabled',
      warnings: [...new Set([...warnings, ...(supabaseReadOnlyStatus?.warnings || [])])],
      founderNextSteps: discovery.nextSteps,
    };
    await this.audit(context, 'status', { sourceMode, entityCount: status.discoveredEntities.length });
    return status;
  }

  fixture(name) {
    return readJson(`tests/fixtures/cornermex/${name}.sample.json`);
  }

  applyFilters(rows, filters = {}) {
    const limit = Math.max(1, Math.min(Number(filters.limit) || this.config.maxRows, this.config.maxRows));
    return rows
      .filter((row) => Object.entries(filters)
        .filter(([key]) => key !== 'limit')
        .every(([key, value]) => value === undefined || row[key] === value))
      .slice(0, limit)
      .map((row) => this.config.piiMasking ? maskPii(sanitizeValue(row)) : row);
  }

  async readCollection(name, filters = {}, context = {}) {
    const status = this.supabaseReadOnlyActivationService?.getStatus
      ? await this.supabaseReadOnlyActivationService.getStatus(context)
      : null;
    const discovery = this.discoveryService?.discover ? await this.discoveryService.discover() : null;
    const sourceMode = [
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY,
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL,
    ].includes(status?.mode)
      ? status.mode
      : this.getSourceMode(discovery);
    if (
      [LOVABLE_SOURCE_MODES.REAL_READ_ONLY, LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL].includes(sourceMode)
      && this.supabaseReadOnlyActivationService?.listEntity
    ) {
      return this.supabaseReadOnlyActivationService.listEntity(name, filters, context);
    }
    const rows = this.applyFilters(this.fixture(name), filters);
    const result = {
      data: rows,
      meta: {
        source: sourceMode,
        dataSource: sourceMode === LOVABLE_SOURCE_MODES.REPO_DISCOVERED ? 'lovable_repo_discovery' : 'mock_fallback',
        supabaseStatus: status?.supabaseStatus || 'not_configured',
        tableAvailability: status?.tableAvailability || {},
        maskingApplied: this.config.piiMasking,
        auditId: status?.auditId || null,
        lastReadAt: status?.lastReadAt || null,
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        rowCount: rows.length,
        truncated: rows.length >= Math.min(Number(filters.limit) || this.config.maxRows, this.config.maxRows),
        warnings: !this.config.enabled && !this.config.lovableRepoConfigured && !this.config.supabaseConfigured
          ? ['CornerMex Lovable connector is not configured; mock fixture data returned.']
          : [],
      },
    };
    await this.audit(context, `list_${name}`, {
      rowCount: rows.length,
      sourceMode: result.meta.source,
    });
    return result;
  }

  async readById(name, id, context = {}) {
    const status = this.supabaseReadOnlyActivationService?.getStatus
      ? await this.supabaseReadOnlyActivationService.getStatus(context)
      : null;
    const sourceMode = [
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY,
      LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL,
    ].includes(status?.mode)
      ? status.mode
      : this.getSourceMode();
    if (
      [LOVABLE_SOURCE_MODES.REAL_READ_ONLY, LOVABLE_SOURCE_MODES.REAL_READ_ONLY_PARTIAL].includes(sourceMode)
      && this.supabaseReadOnlyActivationService?.getEntityById
    ) {
      return this.supabaseReadOnlyActivationService.getEntityById(name, id, context);
    }
    const result = await this.readCollection(name, {}, context);
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
    if (!this.config.auditReads) return null;
    return this.auditLogService?.record?.({
      ...context,
      eventType: 'cornermex_lovable_read',
      dataSource: 'cornermex_lovable',
      operation,
      policyDecision: 'allowed',
      status: 'success',
      input: details,
    });
  }

  listProducts(filters = {}, context = {}) { return this.readCollection('products', filters, context); }
  listLeads(filters = {}, context = {}) { return this.readCollection('leads', filters, context); }
  listQuotes(filters = {}, context = {}) { return this.readCollection('quotes', filters, context); }
  listOrders(filters = {}, context = {}) { return this.readCollection('orders', filters, context); }
  listCustomers(filters = {}, context = {}) { return this.readCollection('customers', filters, context); }
  getProductById(id, context = {}) { return this.readById('products', id, context); }
  getLeadById(id, context = {}) { return this.readById('leads', id, context); }
  getQuoteById(id, context = {}) { return this.readById('quotes', id, context); }
  getOrderById(id, context = {}) { return this.readById('orders', id, context); }
  getCustomerById(id, context = {}) { return this.readById('customers', id, context); }
}

module.exports = { LovableCornerMexConnector, maskPii };
