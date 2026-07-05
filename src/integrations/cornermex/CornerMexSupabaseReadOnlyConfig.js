const { serviceRoleLike } = require('../lovable/CornerMexLovableConfigValidator');

const DEFAULT_ENTITY_TABLES = Object.freeze({
  products: 'products',
  leads: 'b2b_leads',
  quotes: 'b2b_leads',
  orders: 'orders',
  customers: 'profiles',
  payments: 'orders',
  fulfillment: 'orders',
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

const tableMappingsFromConfig = (config = {}) => ({
  products: config.cornermexSupabaseProductsTable || DEFAULT_ENTITY_TABLES.products,
  leads: config.cornermexSupabaseLeadsTable || DEFAULT_ENTITY_TABLES.leads,
  quotes: config.cornermexSupabaseQuotesTable || DEFAULT_ENTITY_TABLES.quotes,
  orders: config.cornermexSupabaseOrdersTable || DEFAULT_ENTITY_TABLES.orders,
  customers: config.cornermexSupabaseCustomersTable || DEFAULT_ENTITY_TABLES.customers,
  payments: config.cornermexSupabasePaymentsTable || DEFAULT_ENTITY_TABLES.payments,
  fulfillment: config.cornermexSupabaseFulfillmentTable || DEFAULT_ENTITY_TABLES.fulfillment,
});

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
    const tableMappings = tableMappingsFromConfig(config);
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
      tableAvailability: Object.fromEntries(
        Object.keys(tableMappings).map((entity) => [entity, TABLE_AVAILABILITY.CONFIG_MISSING]),
      ),
      warnings: [
        ...missing.map((item) => `Missing ${item}.`),
        ...unsafe,
      ],
    };
  }
}

module.exports = {
  CornerMexSupabaseReadOnlyConfig,
  DEFAULT_ENTITY_TABLES,
  SOURCE_MODES,
  SUPABASE_STATUS,
  TABLE_AVAILABILITY,
  tableMappingsFromConfig,
};
