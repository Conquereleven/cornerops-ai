class DataSyncService {
  constructor({ enabled = false, intervalMinutes = 15 } = {}) {
    this.enabled = enabled;
    this.intervalMinutes = intervalMinutes;
    this.lastSync = null;
  }

  async getStatus() {
    return {
      enabled: this.enabled,
      intervalMinutes: this.intervalMinutes,
      lastSyncAt: this.lastSync,
      mode: this.enabled ? 'scheduled_read_only' : 'disabled',
    };
  }

  async dryRunSync(sourceId = 'all') {
    const now = new Date().toISOString();
    this.lastSync = now;
    return {
      status: 'dry_run',
      sourceId,
      startedAt: now,
      completedAt: now,
      message: 'No external source was mutated or contacted.',
    };
  }
}

module.exports = {
  DataSyncService,
};
