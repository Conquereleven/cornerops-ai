class AuditLogService {
  constructor({ repository, enabled = true } = {}) {
    this.repository = repository;
    this.enabled = enabled;
  }

  async record(event) {
    if (!this.enabled || !this.repository) return null;
    return this.repository.createAuditLog(event);
  }

  async list(filters) {
    return this.repository.listAuditLogs(filters);
  }
}

module.exports = {
  AuditLogService,
};
