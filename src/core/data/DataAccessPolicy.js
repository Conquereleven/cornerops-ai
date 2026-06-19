const { DATA_MODES, DATA_OPERATIONS } = require('./dataTypes');
const {
  maskEmail,
  maskPhone,
  sanitizeValue,
} = require('../security/SecuritySanitizer');

const maskPii = (value) => sanitizeValue(value);
const KNOWN_OPERATIONS = new Set(Object.values(DATA_OPERATIONS));
const KNOWN_MODES = new Set(DATA_MODES);

class DataAccessPolicy {
  constructor({
    allowedUsers = [],
    auditEnabled = true,
    dryRun = true,
    requireAudit = true,
    requireApproval = true,
  } = {}) {
    this.allowedUsers = new Set(allowedUsers);
    this.auditEnabled = auditEnabled;
    this.dryRun = dryRun;
    this.requireAudit = requireAudit;
    this.requireApproval = requireApproval;
  }

  evaluate({ agentId, channel, dataSource, operation, userId } = {}) {
    if (!dataSource) return this.deny('Data source is required.');
    if (!dataSource.id || !KNOWN_MODES.has(dataSource.mode)) {
      return this.deny('Data source identity or mode is unknown.');
    }
    if (!KNOWN_OPERATIONS.has(operation)) {
      return this.deny(`Unknown data operation: ${operation || 'missing'}.`);
    }
    if (this.requireAudit && !this.auditEnabled) {
      return this.deny('Data access denied because audit logging is unavailable.');
    }
    if (!dataSource.enabled) return this.deny(`Data source ${dataSource.id} is disabled.`);
    if (this.allowedUsers.size && !this.allowedUsers.has(userId)) {
      return this.deny('User is not authorized for data access.');
    }
    if (dataSource.allowedAgents?.length && !dataSource.allowedAgents.includes(agentId)) {
      return this.deny(`Agent ${agentId} is not allowed to access ${dataSource.id}.`);
    }
    if (dataSource.allowedChannels?.length && !dataSource.allowedChannels.includes(channel)) {
      return this.deny(`Channel ${channel} is not allowed for ${dataSource.id}.`);
    }
    if (dataSource.allowedOperations?.length && !dataSource.allowedOperations.includes(operation)) {
      return this.deny(`Operation ${operation} is not allowed for ${dataSource.id}.`);
    }

    const isWrite = [DATA_OPERATIONS.WRITE, DATA_OPERATIONS.PROPOSE_WRITE].includes(operation);
    if (operation === DATA_OPERATIONS.WRITE || (isWrite && this.requireApproval)) {
      return {
        allowed: true,
        decision: 'approval_required',
        requiresApproval: true,
        dryRun: true,
        maskPii: dataSource.piiLevel !== 'none',
        reason: 'Write/external operations require approval by default.',
      };
    }
    if (this.dryRun || dataSource.mode === 'mock') {
      return {
        allowed: true,
        decision: 'dry_run',
        requiresApproval: false,
        dryRun: true,
        maskPii: dataSource.piiLevel !== 'none',
        reason: 'Data access is operating in mock/dry-run mode.',
      };
    }
    return {
      allowed: true,
      decision: 'allowed',
      requiresApproval: false,
      dryRun: false,
      maskPii: dataSource.piiLevel !== 'none',
      reason: 'Read operation allowed.',
    };
  }

  deny(reason) {
    return {
      allowed: false,
      decision: 'denied',
      requiresApproval: false,
      dryRun: this.dryRun,
      reason,
    };
  }
}

module.exports = {
  DataAccessPolicy,
  maskEmail,
  maskPhone,
  maskPii,
};
