const { maskPii } = require('../data/DataAccessPolicy');

const piiRank = Object.freeze({ none: 0, low: 1, medium: 2, high: 3 });
const KNOWN_MODES = new Set(['mock', 'read_only', 'sync_allowed', 'approval_required', 'disabled']);
const KNOWN_OPERATIONS = new Set([
  'search', 'read', 'summarize', 'dry_run_sync', 'sync', 'write', 'enable', 'delete',
  'retention_change',
]);

const maskContextRecord = (record = {}) => {
  const masked = maskPii(record);
  if (record.piiLevel === 'high') {
    return {
      ...masked,
      author: record.author ? '[MASKED_AUTHOR]' : undefined,
      participants: Array.isArray(record.participants)
        ? record.participants.map(() => '[MASKED_PARTICIPANT]')
        : undefined,
    };
  }
  return masked;
};

class ContextAccessPolicy {
  constructor({
    allowedUsers = [],
    auditEnabled = true,
    dryRun = true,
    piiMasking = true,
    readOnly = true,
    requireAudit = true,
    requireApproval = true,
  } = {}) {
    this.allowedUsers = new Set(allowedUsers);
    this.auditEnabled = auditEnabled;
    this.dryRun = dryRun;
    this.piiMasking = piiMasking;
    this.readOnly = readOnly;
    this.requireAudit = requireAudit;
    this.requireApproval = requireApproval;
  }

  evaluate({ agentId, channel = 'internal', operation = 'search', source, userId } = {}) {
    if (!source) return this.deny('Context source is required.');
    if (!source.id || !KNOWN_MODES.has(source.mode)) {
      return this.deny('Context source identity or mode is unknown.');
    }
    if (!KNOWN_OPERATIONS.has(operation)) {
      return this.deny(`Unknown context operation: ${operation || 'missing'}.`);
    }
    if (this.requireAudit && !this.auditEnabled) {
      return this.deny('Context access denied because audit logging is unavailable.');
    }
    if (!(source.piiLevel in piiRank)) {
      return this.deny(`Unknown PII level for ${source.id}.`);
    }
    if (!source.enabled || source.mode === 'disabled') return this.deny(`Context source ${source.id} is disabled.`);
    if (!source.searchable && ['search', 'summarize'].includes(operation)) {
      return this.deny(`Context source ${source.id} is not searchable.`);
    }
    if (this.allowedUsers.size && !this.allowedUsers.has(userId)) {
      return this.deny('User is not authorized for context access.');
    }
    if (source.allowedAgents?.length && !source.allowedAgents.includes(agentId)) {
      return this.deny(`Agent ${agentId} is not allowed to access ${source.id}.`);
    }
    if (source.allowedChannels?.length && !source.allowedChannels.includes(channel)) {
      return this.deny(`Channel ${channel} is not allowed for ${source.id}.`);
    }
    if (source.allowedOperations?.length && !source.allowedOperations.includes(operation)) {
      return this.deny(`Operation ${operation} is not allowed for ${source.id}.`);
    }
    if (this.requireApproval && (source.requiresApprovalFor || []).includes(operation)) {
      return {
        allowed: true,
        decision: 'approval_required',
        dryRun: true,
        requiresApproval: true,
        maskPii: this.piiMasking || piiRank[source.piiLevel] > piiRank.low,
        reason: 'Context operation requires human approval.',
      };
    }
    if (this.readOnly && ['write', 'sync', 'enable', 'delete'].includes(operation)) {
      return {
        allowed: true,
        decision: 'approval_required',
        dryRun: true,
        requiresApproval: true,
        maskPii: true,
        reason: 'Read-only context mode blocks writes without approval.',
      };
    }
    return {
      allowed: true,
      decision: this.dryRun || source.mode === 'mock' ? 'dry_run' : 'allowed',
      dryRun: this.dryRun || source.mode === 'mock',
      requiresApproval: false,
      maskPii: this.piiMasking || piiRank[source.piiLevel] > piiRank.low,
      reason: 'Context read/search allowed.',
    };
  }

  filterByPii(records = [], piiMaxLevel = 'high') {
    const maxRank = piiRank[piiMaxLevel] ?? piiRank.high;
    return records.filter((record) => (piiRank[record.piiLevel] ?? piiRank.high) <= maxRank);
  }

  sanitizeRecord(record) {
    return this.piiMasking ? maskContextRecord(record) : { ...record };
  }

  deny(reason) {
    return {
      allowed: false,
      decision: 'denied',
      dryRun: true,
      requiresApproval: false,
      maskPii: true,
      reason,
    };
  }
}

module.exports = {
  ContextAccessPolicy,
  maskContextRecord,
  piiRank,
};
