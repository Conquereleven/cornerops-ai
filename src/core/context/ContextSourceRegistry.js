const { CONTEXT_SOURCE_IDS } = require('./contextTypes');

const CHANNELS = ['whatsapp', 'telegram', 'slack', 'web', 'internal'];
const ALL_AGENTS = [
  'daily-briefing-agent',
  'b2b-sales-agent',
  'quotes-orders-agent',
  'dev-codex-github-agent',
  'security-audit-agent',
];

const contextSourceDefaults = (config = {}) => {
  const enabled = Boolean(config.contextLayerEnabled);
  const mode = enabled ? (config.contextMode || 'mock') : 'mock';
  const retentionDays = config.retentionDays || 180;
  const source = (id, options = {}) => ({
    id,
    name: options.name || id,
    enabled: options.enabled ?? (enabled && Boolean(options.featureEnabled)),
    mode: options.mode || mode,
    adapter: options.adapter || 'mock',
    piiLevel: options.piiLevel || 'medium',
    allowedAgents: options.allowedAgents || ALL_AGENTS,
    allowedChannels: options.allowedChannels || CHANNELS,
    allowedOperations: options.allowedOperations || ['search', 'read', 'summarize', 'dry_run_sync'],
    requiresApprovalFor: options.requiresApprovalFor || ['sync', 'enable', 'retention_change'],
    retentionDays,
    searchable: options.searchable ?? true,
    syncEnabled: options.syncEnabled ?? false,
  });

  return [
    source('github_archive', { name: 'GitHub archive', adapter: 'gitcrawl', featureEnabled: config.githubContextEnabled, piiLevel: 'medium', allowedAgents: ['daily-briefing-agent', 'dev-codex-github-agent', 'security-audit-agent'] }),
    source('slack_archive', { name: 'Slack archive', adapter: 'slacrawl', featureEnabled: config.slackContextEnabled, piiLevel: 'medium' }),
    source('whatsapp_archive', { name: 'WhatsApp archive', adapter: 'wacrawl', featureEnabled: config.whatsappContextEnabled, piiLevel: 'high' }),
    source('telegram_archive', { name: 'Telegram archive', adapter: 'telecrawl', featureEnabled: config.telegramContextEnabled, piiLevel: 'high' }),
    source('notion_archive', { name: 'Notion archive', adapter: 'notcrawl', featureEnabled: config.notionContextEnabled, piiLevel: 'medium' }),
    source('discord_archive', { name: 'Discord archive', adapter: 'discrawl', featureEnabled: false, piiLevel: 'medium', mode: 'disabled' }),
    source('granola_notes', { name: 'Granola notes', adapter: 'mock', featureEnabled: false, piiLevel: 'medium', mode: 'disabled' }),
    source('apple_messages', { name: 'Apple Messages', adapter: 'mock', featureEnabled: false, piiLevel: 'high', mode: 'disabled' }),
    source('apple_photos', { name: 'Apple Photos', adapter: 'mock', featureEnabled: false, piiLevel: 'high', mode: 'disabled' }),
    source('google_workspace', { name: 'Google Workspace', adapter: 'gogcli', featureEnabled: config.googleWorkspaceContextEnabled, piiLevel: 'high' }),
    source('google_places', { name: 'Google Places', adapter: 'goplaces', featureEnabled: config.goplacesEnabled, piiLevel: 'low' }),
    source('pdf_documents', { name: 'PDF documents', adapter: 'clawpdf', featureEnabled: config.clawpdfEnabled, piiLevel: 'high' }),
    source('media_transcripts', { name: 'Media transcripts', adapter: 'mock', featureEnabled: false, piiLevel: 'high', mode: 'disabled' }),
    source('manual_uploads', { name: 'Manual uploads', adapter: 'mock', featureEnabled: enabled, piiLevel: 'medium' }),
  ];
};

class ContextSourceRegistry {
  constructor({ config = {}, sources } = {}) {
    this.sources = new Map();
    (sources || contextSourceDefaults(config)).forEach((source) => this.register(source));
  }

  register(source) {
    if (!source?.id || !CONTEXT_SOURCE_IDS.includes(source.id)) {
      throw new Error(`Invalid context source id: ${source?.id}`);
    }
    if (this.sources.has(source.id)) throw new Error(`Duplicate context source id: ${source.id}`);
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
  ContextSourceRegistry,
  contextSourceDefaults,
};
