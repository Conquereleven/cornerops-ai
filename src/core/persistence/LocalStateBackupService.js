const fs = require('fs');
const path = require('path');
const { sanitizePersistencePayload } = require('../security/SecuritySanitizer');

const DEFAULT_STORES = [
  ['approvals', '.cornerops/state/human-approvals.json'],
  ['auditLogs', '.cornerops/state/audit-log.json'],
  ['sessions', '.cornerops/state/operator-sessions.json'],
  ['idempotency', '.cornerops/state/controlled-action-idempotency.json'],
  ['internalNotes', '.cornerops/state/internal-notes.json'],
  ['internalTasks', '.cornerops/state/internal-tasks.json'],
  ['replay', '.cornerops/security/replay-store.json'],
  ['rejections', '.cornerops/security/rejections.json'],
  ['rateLimits', '.cornerops/security/rate-limits.json'],
];

const timestampForFilename = (date = new Date()) => date.toISOString().replace(/[:.]/g, '-');

class LocalStateBackupService {
  constructor({
    backupRoot = './.cornerops/backups',
    cwd = process.cwd(),
    now = () => new Date(),
    stores = DEFAULT_STORES,
  } = {}) {
    this.backupRoot = backupRoot;
    this.cwd = cwd;
    this.now = now;
    this.stores = stores;
  }

  createBackup() {
    const createdAt = this.now();
    const backup = this.buildSummary({ includeRecords: true, createdAt });
    const filePath = path.resolve(this.cwd, this.backupRoot, `cornerops-local-state-${timestampForFilename(createdAt)}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
    fs.writeFileSync(filePath, `${JSON.stringify(backup, null, 2)}\n`, { mode: 0o600 });
    return {
      path: path.relative(this.cwd, filePath),
      createdAt: backup.createdAt,
      counts: backup.counts,
      warnings: backup.warnings,
      secretsRedacted: true,
      productionDbIncluded: false,
    };
  }

  exportSummary() {
    return this.buildSummary({ includeRecords: false, createdAt: this.now() });
  }

  getLatestBackupSummary() {
    const dir = path.resolve(this.cwd, this.backupRoot);
    if (!fs.existsSync(dir)) {
      return { exists: false, latestPath: null, latestAt: null, warnings: ['No local backup has been created yet.'] };
    }
    const files = fs.readdirSync(dir)
      .filter((file) => file.startsWith('cornerops-local-state-') && file.endsWith('.json'))
      .map((file) => {
        const fullPath = path.join(dir, file);
        return { file, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    if (!files.length) {
      return { exists: false, latestPath: null, latestAt: null, warnings: ['No local backup has been created yet.'] };
    }
    return {
      exists: true,
      latestPath: path.relative(this.cwd, files[0].fullPath),
      latestAt: new Date(files[0].mtimeMs).toISOString(),
      warnings: [],
    };
  }

  buildSummary({ includeRecords, createdAt }) {
    const stores = {};
    const counts = {};
    const warnings = [];
    for (const [key, relativePath] of this.stores) {
      const fullPath = path.resolve(this.cwd, relativePath);
      const store = this.readStore(fullPath);
      stores[key] = {
        path: relativePath,
        exists: store.exists,
        healthy: store.healthy,
        count: store.count,
        latestTimestamp: store.latestTimestamp,
        warning: store.warning,
        records: includeRecords ? store.records : undefined,
      };
      counts[key] = store.count;
      if (store.warning) warnings.push(`${key}: ${store.warning}`);
    }
    return {
      version: 'v1.0',
      createdAt: createdAt.toISOString(),
      localOnly: true,
      productionDbIncluded: false,
      rawTokensIncluded: false,
      rawPrivateMessagesIncluded: false,
      piiMasked: true,
      secretsRedacted: true,
      counts,
      stores,
      warnings,
    };
  }

  readStore(fullPath) {
    if (!fs.existsSync(fullPath)) {
      return { exists: false, healthy: true, count: 0, latestTimestamp: null, records: [], warning: 'store missing; treated as empty' };
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const records = Array.isArray(parsed.records) ? parsed.records : [];
      const sanitizedRecords = sanitizePersistencePayload(records);
      return {
        exists: true,
        healthy: true,
        count: records.length,
        latestTimestamp: this.latestTimestamp(records),
        records: sanitizedRecords.map((record) => this.summarizeRecord(record)),
      };
    } catch (error) {
      return { exists: true, healthy: false, count: 0, latestTimestamp: null, records: [], warning: 'store unreadable or invalid JSON' };
    }
  }

  latestTimestamp(records) {
    const candidates = records
      .map((record) => record.updatedAt || record.createdAt || record.timestamp || record.lastSeenAt)
      .filter(Boolean)
      .sort();
    return candidates[candidates.length - 1] || null;
  }

  summarizeRecord(record) {
    const sanitized = sanitizePersistencePayload(record);
    return {
      id: sanitized.id || sanitized.auditId || sanitized.key || 'record',
      type: sanitized.actionType || sanitized.eventType || sanitized.status || sanitized.operation || 'local_state_record',
      status: sanitized.status || sanitized.executionStatus || undefined,
      createdAt: sanitized.createdAt || sanitized.timestamp || undefined,
      updatedAt: sanitized.updatedAt || undefined,
      riskLevel: sanitized.riskLevel || undefined,
      sourceMode: sanitized.sourceMode || sanitized.source || undefined,
    };
  }
}

module.exports = { DEFAULT_STORES, LocalStateBackupService };
