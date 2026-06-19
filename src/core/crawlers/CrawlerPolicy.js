class CrawlerPolicy {
  constructor({ auditEnabled = true, crawlersEnabled = false, dryRun = true, readOnly = true, requireApproval = true, requireAudit = true } = {}) {
    this.auditEnabled = auditEnabled;
    this.crawlersEnabled = crawlersEnabled;
    this.dryRun = dryRun;
    this.readOnly = readOnly;
    this.requireApproval = requireApproval;
    this.requireAudit = requireAudit;
  }

  evaluate({ crawler, operation = 'search' } = {}) {
    if (!crawler) return this.deny('Crawler not found.');
    if (this.requireAudit && !this.auditEnabled) {
      return this.deny('Crawler denied because audit logging is unavailable.');
    }
    if (!['low', 'medium', 'high', 'critical'].includes(crawler.riskLevel)) {
      return this.deny('Crawler risk is unknown.');
    }
    if (!['mock', 'read_only', 'dry_run', 'document_only', 'disabled'].includes(crawler.mode)) {
      return this.deny('Crawler mode is unknown.');
    }
    if (!this.crawlersEnabled || !crawler.enabled) return this.deny(`Crawler ${crawler.id} is disabled.`);
    if (!crawler.allowedOperations.includes(operation)) return this.deny(`Operation ${operation} is not allowed for ${crawler.id}.`);
    if (this.requireApproval && crawler.requiresApprovalFor.includes(operation)) {
      return {
        allowed: true,
        decision: 'approval_required',
        dryRun: true,
        requiresApproval: true,
        reason: 'Crawler operation requires approval.',
      };
    }
    if (this.readOnly && ['sync', 'write', 'delete'].includes(operation)) {
      return {
        allowed: true,
        decision: 'approval_required',
        dryRun: true,
        requiresApproval: true,
        reason: 'Crawler real sync/write is blocked in read-only mode.',
      };
    }
    return {
      allowed: true,
      decision: this.dryRun || crawler.dryRun ? 'dry_run' : 'allowed',
      dryRun: this.dryRun || crawler.dryRun,
      requiresApproval: false,
      reason: 'Crawler operation allowed in current mode.',
    };
  }

  deny(reason) {
    return {
      allowed: false,
      decision: 'denied',
      dryRun: true,
      requiresApproval: false,
      reason,
    };
  }
}

module.exports = {
  CrawlerPolicy,
};
