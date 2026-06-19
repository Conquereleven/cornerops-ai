const nativeToolDefaults = (config = {}) => {
  const tool = (id, options = {}) => ({
    id,
    name: options.name || id,
    enabled: Boolean(options.enabled),
    mode: options.mode || 'disabled',
    allowedOperations: options.allowedOperations || ['healthCheck'],
    requiresApprovalFor: options.requiresApprovalFor || ['enable', 'write', 'send', 'host_control'],
    riskLevel: options.riskLevel || 'high',
  });
  return [
    tool('gogcli', { enabled: config.gogcliEnabled, mode: 'dry_run', allowedOperations: ['healthCheck', 'searchWorkspace', 'dryRunSync'], riskLevel: 'high' }),
    tool('wacli', { enabled: config.wacliEnabled, mode: 'read_only', allowedOperations: ['healthCheck', 'searchArchive'], riskLevel: 'critical' }),
    tool('goplaces', { enabled: config.goplacesEnabled, mode: 'dry_run', allowedOperations: ['healthCheck', 'discoverLeads'], riskLevel: 'medium' }),
    tool('clawpdf', { enabled: config.clawpdfEnabled, mode: 'mock', allowedOperations: ['healthCheck', 'parseMockPdf'], riskLevel: 'medium' }),
    tool('rastermill', { enabled: config.rastermillEnabled, mode: 'document_only', riskLevel: 'medium' }),
    tool('ffmpeg-wasm', { enabled: config.ffmpegWasmEnabled, mode: 'document_only', riskLevel: 'medium' }),
    tool('libterminal', { enabled: false, mode: 'document_only', riskLevel: 'critical' }),
    tool('proxyline', { enabled: false, mode: 'document_only', riskLevel: 'high' }),
    tool('peekaboo', { enabled: false, mode: 'document_only', riskLevel: 'critical' }),
    tool('axorcist', { enabled: false, mode: 'document_only', riskLevel: 'critical' }),
    tool('imsg', { enabled: false, mode: 'document_only', riskLevel: 'critical' }),
    tool('remindctl', { enabled: false, mode: 'document_only', riskLevel: 'high' }),
    tool('spogo', { enabled: false, mode: 'document_only', riskLevel: 'high' }),
    tool('songsee', { enabled: false, mode: 'document_only', riskLevel: 'medium' }),
  ];
};

class NativeToolRegistry {
  constructor({ config = {}, tools } = {}) {
    this.tools = new Map();
    (tools || nativeToolDefaults(config)).forEach((tool) => this.register(tool));
  }

  register(tool) {
    if (!tool?.id) throw new Error('Native tool id is required.');
    if (this.tools.has(tool.id)) throw new Error(`Duplicate native tool id: ${tool.id}`);
    this.tools.set(tool.id, { ...tool });
    return this.get(tool.id);
  }

  get(id) {
    const tool = this.tools.get(id);
    return tool ? { ...tool } : null;
  }

  list() {
    return Array.from(this.tools.values()).map((tool) => ({ ...tool }));
  }
}

module.exports = {
  NativeToolRegistry,
  nativeToolDefaults,
};
