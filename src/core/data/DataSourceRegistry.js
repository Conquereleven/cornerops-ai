const { DATA_OPERATIONS, DATA_SOURCE_IDS } = require('./dataTypes');

const CHANNELS = ['whatsapp', 'telegram', 'slack', 'web', 'internal'];
const ALL_AGENTS = [
  'daily-briefing-agent',
  'b2b-sales-agent',
  'quotes-orders-agent',
  'dev-codex-github-agent',
  'security-audit-agent',
];

const defaultSources = (config = {}) => {
  const allowed = new Set(config.allowedDataSources || DATA_SOURCE_IDS);
  const enabled = config.realDataEnabled || config.dataMode === 'mock';
  const githubRealReadOnly = Boolean(
    config.realSourceOnboardingEnabled
    && config.firstRealSource === 'github'
    && config.firstRealSourceMode === 'read_only'
    && config.githubEnabled
    && config.githubReadOnly,
  );
  const base = (id, options = {}) => ({
    id,
    name: options.name || id,
    enabled: allowed.has(id) && (options.enabled ?? enabled),
    mode: options.mode || config.dataMode || 'mock',
    adapter: options.adapter || 'mock',
    allowedAgents: options.allowedAgents || ALL_AGENTS,
    allowedChannels: options.allowedChannels || CHANNELS,
    allowedOperations: options.allowedOperations || [
      DATA_OPERATIONS.READ,
      DATA_OPERATIONS.DRAFT,
      DATA_OPERATIONS.PROPOSE_WRITE,
      DATA_OPERATIONS.WRITE,
    ],
    requiresApprovalFor: options.requiresApprovalFor || [],
    piiLevel: options.piiLevel || 'low',
  });
  return [
    base('leads', { name: 'Leads', allowedAgents: ['daily-briefing-agent', 'b2b-sales-agent', 'security-audit-agent'] }),
    base('quotes', { name: 'Quotes', allowedAgents: ['daily-briefing-agent', 'b2b-sales-agent', 'quotes-orders-agent', 'security-audit-agent'] }),
    base('orders', { name: 'Orders', allowedAgents: ['daily-briefing-agent', 'quotes-orders-agent', 'security-audit-agent'] }),
    base('github', {
      name: 'GitHub',
      adapter: 'github',
      enabled: enabled || githubRealReadOnly,
      mode: githubRealReadOnly ? 'read_only' : (config.dataMode || 'mock'),
      allowedAgents: ['daily-briefing-agent', 'dev-codex-github-agent', 'security-audit-agent'],
      allowedOperations: [DATA_OPERATIONS.READ, DATA_OPERATIONS.DRAFT],
      piiLevel: 'none',
    }),
    base('audit_logs', { name: 'Audit logs', adapter: 'internal_api', allowedAgents: ['daily-briefing-agent', 'security-audit-agent'], piiLevel: 'medium' }),
    base('approvals', { name: 'Approvals', adapter: 'internal_api', allowedAgents: ['quotes-orders-agent', 'dev-codex-github-agent', 'security-audit-agent'], piiLevel: 'low' }),
    base('agent_logs', { name: 'Agent logs', adapter: 'internal_api', allowedAgents: ['security-audit-agent'], piiLevel: 'low' }),
    base('sync_status', { name: 'Sync status', adapter: 'internal_api', allowedAgents: ALL_AGENTS, piiLevel: 'none' }),
  ];
};

class DataSourceRegistry {
  constructor({ config = {}, sources } = {}) {
    this.config = config;
    this.sources = new Map();
    (sources || defaultSources(config)).forEach((source) => this.register(source));
  }

  register(source) {
    if (!source?.id) throw new Error('Data source id is required.');
    if (this.sources.has(source.id)) throw new Error(`Duplicate data source id: ${source.id}`);
    this.sources.set(source.id, { ...source });
    return this.get(source.id);
  }

  list({ enabledOnly = false } = {}) {
    return Array.from(this.sources.values())
      .filter((source) => !enabledOnly || source.enabled)
      .map((source) => ({ ...source }));
  }

  get(id) {
    const source = this.sources.get(id);
    return source ? { ...source } : null;
  }

  has(id) {
    return this.sources.has(id);
  }
}

module.exports = {
  DataSourceRegistry,
  defaultSources,
};
