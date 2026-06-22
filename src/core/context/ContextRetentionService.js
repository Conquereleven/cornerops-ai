class ContextRetentionService {
  constructor({ retentionDays = 180 } = {}) {
    this.retentionDays = retentionDays;
  }

  isExpired(record = {}, now = new Date()) {
    const updatedAt = new Date(record.updatedAt || record.createdAt || 0);
    const ageMs = now.getTime() - updatedAt.getTime();
    return ageMs > this.retentionDays * 24 * 60 * 60 * 1000;
  }

  findExpired(records = []) {
    return records.filter((record) => this.isExpired(record));
  }

  evaluateChange(input = {}) {
    return {
      status: 'dry_run',
      requiresApproval: true,
      currentRetentionDays: this.retentionDays,
      proposedRetentionDays: input.retentionDays,
      message: 'Retention changes require approval and are not applied in v0.2.',
    };
  }
}

module.exports = {
  ContextRetentionService,
};
