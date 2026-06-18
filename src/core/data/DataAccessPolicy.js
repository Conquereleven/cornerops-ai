const { DATA_OPERATIONS } = require('./dataTypes');

const maskEmail = (email) => {
  const value = String(email || '');
  const [user, domain] = value.split('@');
  if (!user || !domain) return value;
  return `${user.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone) => {
  const value = String(phone || '');
  if (value.length <= 4) return value;
  return `${value.slice(0, 3)}******${value.slice(-4)}`;
};

const SENSITIVE_KEYS = [
  'authorization',
  'password',
  'secret',
  'token',
  'service_role',
  'api_key',
  'apikey',
];

const isSensitiveKey = (key) =>
  SENSITIVE_KEYS.some((entry) => String(key).toLowerCase().includes(entry));

const maskPii = (value, depth = 0) => {
  if (depth > 6) return '[Truncated]';
  if (Array.isArray(value)) return value.map((item) => maskPii(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    const normalized = String(key).toLowerCase();
    if (isSensitiveKey(key)) return [key, '[REDACTED]'];
    if (normalized.includes('email')) return [key, maskEmail(entry)];
    if (normalized.includes('phone') || normalized.includes('whatsapp')) {
      return [key, maskPhone(entry)];
    }
    return [key, maskPii(entry, depth + 1)];
  }));
};

class DataAccessPolicy {
  constructor({
    allowedUsers = [],
    dryRun = true,
    requireApproval = true,
  } = {}) {
    this.allowedUsers = new Set(allowedUsers);
    this.dryRun = dryRun;
    this.requireApproval = requireApproval;
  }

  evaluate({ agentId, channel, dataSource, operation, userId } = {}) {
    if (!dataSource) return this.deny('Data source is required.');
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
