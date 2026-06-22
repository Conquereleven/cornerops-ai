const DAY_MS = 24 * 60 * 60 * 1000;

class OperatorChannelStatusStore {
  constructor() {
    this.reset();
  }

  recordInbound({ at = new Date().toISOString(), rejected = false } = {}) {
    this.lastInboundAt = at;
    if (rejected) this.rejections.push(at);
    this.prune();
  }

  recordOutbound({ at = new Date().toISOString() } = {}) {
    this.lastOutboundAt = at;
  }

  getStatus(config = {}) {
    this.prune();
    const allowedChannels = new Set([
      ...(config.allowedChannelIds || []),
      ...(config.allowedChatIds || []),
    ]);
    const warnings = [];
    if (!config.enabled) warnings.push('Real operator channel is disabled.');
    if (config.provider !== 'mock' && !(config.allowedUserIds || []).length) {
      warnings.push('No operator user allowlist is configured.');
    }
    if (config.provider !== 'mock' && !allowedChannels.size) {
      warnings.push('No operator channel/chat allowlist is configured.');
    }
    if (!config.dryRun) warnings.push('Operator channel dry-run is disabled.');
    return {
      enabled: Boolean(config.enabled),
      provider: config.provider || 'mock',
      mode: !config.enabled ? 'disabled'
        : config.provider === 'mock' ? 'mock'
          : config.dryRun ? 'dry_run' : 'read_only',
      dryRun: config.dryRun !== false,
      replyEnabled: config.replyEnabled !== false,
      replyDryRun: config.replyDryRun !== false,
      allowlistEnabled: config.requireAllowlist !== false,
      allowedUsersCount: (config.allowedUserIds || []).length,
      allowedChannelsCount: allowedChannels.size,
      lastInboundAt: this.lastInboundAt,
      lastOutboundAt: this.lastOutboundAt,
      rejectedLast24h: this.rejections.length,
      warnings,
    };
  }

  prune() {
    const cutoff = Date.now() - DAY_MS;
    this.rejections = this.rejections.filter((value) => new Date(value).getTime() >= cutoff);
  }

  reset() {
    this.lastInboundAt = undefined;
    this.lastOutboundAt = undefined;
    this.rejections = [];
  }
}

const operatorChannelStatusStore = new OperatorChannelStatusStore();

module.exports = { OperatorChannelStatusStore, operatorChannelStatusStore };
