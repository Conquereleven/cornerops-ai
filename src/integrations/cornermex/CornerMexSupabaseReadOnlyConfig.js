const { serviceRoleLike } = require('../lovable/CornerMexLovableConfigValidator');

const LEGACY_ENTITY_TABLES = Object.freeze({
  products: 'products',
  leads: 'b2b_leads',
  quotes: 'b2b_leads',
  orders: 'orders',
  customers: 'profiles',
  payments: 'orders',
  fulfillment: 'orders',
});

const DEFAULT_READ_VIEW_TABLES = Object.freeze({
  products: 'cornerops_products_v',
  leads: 'cornerops_b2b_leads_v',
  quotes: 'cornerops_b2b_leads_v',
  orders: 'cornerops_orders_v',
  customers: 'cornerops_customers_v',
  payments: 'cornerops_payments_v',
  fulfillment: 'cornerops_fulfillment_v',
});

const DEFAULT_ENTITY_TABLES = LEGACY_ENTITY_TABLES;

const ENTITY_TABLE_MAP_KEYS = Object.freeze({
  products: ['products'],
  leads: ['leads', 'b2bLeads', 'b2b_leads'],
  quotes: ['quotes'],
  orders: ['orders'],
  customers: ['customers'],
  payments: ['payments'],
  fulfillment: ['fulfillment'],
});

const ENTITY_SPECIFIC_CONFIG_KEYS = Object.freeze({
  products: 'cornermexSupabaseProductsTable',
  leads: 'cornermexSupabaseLeadsTable',
  quotes: 'cornermexSupabaseQuotesTable',
  orders: 'cornermexSupabaseOrdersTable',
  customers: 'cornermexSupabaseCustomersTable',
  payments: 'cornermexSupabasePaymentsTable',
  fulfillment: 'cornermexSupabaseFulfillmentTable',
});

const SOURCE_MODES = Object.freeze({
  MOCK: 'mock',
  REPO_DISCOVERED: 'repo_discovered',
  REAL_READ_ONLY: 'real_read_only',
  REAL_READ_ONLY_PARTIAL: 'real_read_only_partial',
  BLOCKED_UNSAFE_CONFIG: 'blocked_unsafe_config',
});

const SUPABASE_STATUS = Object.freeze({
  CONNECTED: 'connected',
  CONNECTED_NO_PUBLIC_READ_MODEL: 'connected_no_public_read_model',
  PARTIAL: 'partial',
  NOT_CONFIGURED: 'not_configured',
  BLOCKED: 'blocked',
  ERROR_SANITIZED: 'error_sanitized',
});

const TABLE_AVAILABILITY = Object.freeze({
  AVAILABLE: 'available',
  AVAILABLE_EMPTY: 'available_empty',
  AVAILABLE_MASKED: 'available_masked',
  MISSING_TABLE: 'missing_table',
  RLS_BLOCKED: 'rls_blocked',
  CONFIG_MISSING: 'config_missing',
  TIMEOUT: 'timeout',
  ERROR_SANITIZED: 'error_sanitized',
});

const hasValue = (value) => String(value || '').trim().length > 0;
const parseLimit = (value, fallback = 50) => Math.max(1, Math.min(Number(value) || fallback, 1000));
const parseTimeout = (value, fallback = 8000) => Math.max(100, Math.min(Number(value) || fallback, 30000));
const validTableIdentifier = (value) => /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(String(value || ''));

const parseTableMapJson = (value) => {
  if (!hasValue(value)) return { map: {}, warnings: [] };
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { map: {}, warnings: ['CORNERMEX_SUPABASE_TABLE_MAP_JSON must be a JSON object.'] };
    }
    const map = {};
    const warnings = [];
    Object.entries(parsed).forEach(([key, table]) => {
      if (!hasValue(table)) return;
      if (!validTableIdentifier(table)) {
        warnings.push(`Ignoring invalid table/view identifier for ${key}.`);
        return;
      }
      map[key] = String(table).trim();
    });
    return { map, warnings };
  } catch (_error) {
    return { map: {}, warnings: ['CORNERMEX_SUPABASE_TABLE_MAP_JSON is not valid JSON.'] };
  }
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const explicitTableForEntity = (entity, config = {}, jsonMap = {}) => {
  const jsonKeys = ENTITY_TABLE_MAP_KEYS[entity] || [entity];
  const jsonMatch = jsonKeys.map((key) => jsonMap[key]).find(hasValue);
  const specificMatch = config[ENTITY_SPECIFIC_CONFIG_KEYS[entity]];
  return jsonMatch || specificMatch || '';
};

const tableMappingsFromConfig = (config = {}) => ({
  products: tableMappingCandidatesFromConfig(config).products[0],
  leads: tableMappingCandidatesFromConfig(config).leads[0],
  quotes: tableMappingCandidatesFromConfig(config).quotes[0],
  orders: tableMappingCandidatesFromConfig(config).orders[0],
  customers: tableMappingCandidatesFromConfig(config).customers[0],
  payments: tableMappingCandidatesFromConfig(config).payments[0],
  fulfillment: tableMappingCandidatesFromConfig(config).fulfillment[0],
});

const tableMappingCandidatesFromConfig = (config = {}) => {
  const { map } = parseTableMapJson(config.cornermexSupabaseTableMapJson);
  return Object.fromEntries(Object.keys(LEGACY_ENTITY_TABLES).map((entity) => [
    entity,
    unique([
      explicitTableForEntity(entity, config, map),
      DEFAULT_READ_VIEW_TABLES[entity],
      LEGACY_ENTITY_TABLES[entity],
    ]),
  ]));
};

class CornerMexSupabaseReadOnlyConfig {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  validate() {
    const config = this.config;
    const enabled = Boolean(config.cornermexSupabaseEnabled);
    const urlConfigured = hasValue(config.cornermexSupabaseUrl);
    const anonKeyConfigured = hasValue(config.cornermexSupabaseAnonKey);
    const readOnly = config.cornermexSupabaseReadOnly !== false;
    const allowWrites = Boolean(config.cornermexSupabaseAllowWrites);
    const serviceRoleKeyBlocked = config.cornermexSupabaseServiceRoleKeyBlocked !== false;
    const maskingApplied = config.cornermexSupabaseMaskPii !== false && config.cornermexSupabasePiiMasking !== false;
    const auditReads = config.cornermexSupabaseAuditReads !== false;
    const failClosed = config.cornermexSupabaseFailClosed !== false;
    const serviceRoleKeySuspected = serviceRoleLike(config.cornermexSupabaseAnonKey);
    const missing = [
      !enabled ? 'CORNERMEX_SUPABASE_ENABLED=true' : null,
      !urlConfigured ? 'CORNERMEX_SUPABASE_URL' : null,
      !anonKeyConfigured ? 'CORNERMEX_SUPABASE_ANON_KEY' : null,
    ].filter(Boolean);
    const unsafe = [
      !readOnly ? 'CORNERMEX_SUPABASE_READ_ONLY must be true' : null,
      allowWrites ? 'CORNERMEX_SUPABASE_ALLOW_WRITES must be false' : null,
      !serviceRoleKeyBlocked ? 'CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED must be true' : null,
      !failClosed ? 'CORNERMEX_SUPABASE_FAIL_CLOSED must be true' : null,
      serviceRoleKeySuspected ? 'CORNERMEX_SUPABASE_ANON_KEY looks service-role-like; use anon/publishable key only' : null,
    ].filter(Boolean);
    const { warnings: tableMapWarnings } = parseTableMapJson(config.cornermexSupabaseTableMapJson);
    const tableMappingCandidates = tableMappingCandidatesFromConfig(config);
    const tableMappings = Object.fromEntries(
      Object.entries(tableMappingCandidates).map(([entity, candidates]) => [entity, candidates[0]]),
    );
    return {
      enabled,
      safe: unsafe.length === 0,
      activationCandidate: enabled && urlConfigured && anonKeyConfigured && unsafe.length === 0,
      sourceMode: unsafe.length
        ? SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
        : enabled && urlConfigured && anonKeyConfigured ? SOURCE_MODES.REPO_DISCOVERED : SOURCE_MODES.REPO_DISCOVERED,
      supabaseStatus: unsafe.length
        ? SUPABASE_STATUS.BLOCKED
        : enabled && urlConfigured && anonKeyConfigured ? SUPABASE_STATUS.NOT_CONFIGURED : SUPABASE_STATUS.NOT_CONFIGURED,
      missing,
      unsafe,
      readOnlyFlags: {
        readOnly,
        allowWrites,
        serviceRoleKeyBlocked,
        auditReads,
        maskingApplied,
        failClosed,
      },
      secrets: {
        urlPresent: urlConfigured,
        anonKeyPresent: anonKeyConfigured,
        anonKeyPrinted: false,
        serviceRoleKeySuspected,
      },
      limits: {
        maxRows: parseLimit(config.cornermexSupabaseMaxRows, 50),
        requestTimeoutMs: parseTimeout(
          config.cornermexSupabaseRequestTimeoutMs || config.cornermexSupabaseQueryTimeoutMs,
          8000,
        ),
      },
      tableMappings,
      tableMappingCandidates,
      tableAvailability: Object.fromEntries(
        Object.keys(tableMappings).map((entity) => [entity, TABLE_AVAILABILITY.CONFIG_MISSING]),
      ),
      warnings: [
        ...missing.map((item) => `Missing ${item}.`),
        ...unsafe,
        ...tableMapWarnings,
      ],
    };
  }
}

module.exports = {
  CornerMexSupabaseReadOnlyConfig,
  DEFAULT_ENTITY_TABLES,
  DEFAULT_READ_VIEW_TABLES,
  LEGACY_ENTITY_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
  parseTableMapJson,
  tableMappingCandidatesFromConfig,
  tableMappingsFromConfig,
};
