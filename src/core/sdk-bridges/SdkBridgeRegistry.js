class SdkBridgeRegistry {
  constructor({ config = {} } = {}) {
    this.bridges = new Map([
      ['mcporter', { id: 'mcporter', enabled: Boolean(config.mcporterEnabled), mode: 'dry_run', riskLevel: 'medium' }],
      ['acpx', { id: 'acpx', enabled: Boolean(config.acpEnabled), mode: 'dry_run', riskLevel: 'medium' }],
      ['plugin-inspector', { id: 'plugin-inspector', enabled: Boolean(config.pluginInspectorEnabled), mode: 'mock', riskLevel: 'high' }],
      ['clawbench', { id: 'clawbench', enabled: Boolean(config.clawbenchEnabled), mode: 'dry_run', riskLevel: 'low' }],
      ['agent-skills', { id: 'agent-skills', enabled: true, mode: 'read_only', riskLevel: 'medium' }],
      ['clawpatch', { id: 'clawpatch', enabled: Boolean(config.clawpatchEnabled), mode: 'document_only', riskLevel: 'critical' }],
    ]);
  }

  list() {
    return Array.from(this.bridges.values()).map((bridge) => ({ ...bridge }));
  }

  get(id) {
    const bridge = this.bridges.get(id);
    return bridge ? { ...bridge } : null;
  }
}

module.exports = {
  SdkBridgeRegistry,
};
