const { randomUUID } = require('crypto');
const { sanitizeAuditPayload, sanitizeMessage } = require('../security/SecuritySanitizer');

class OperatorSessionService {
  constructor({ maxSessions = 100 } = {}) {
    this.maxSessions = Math.max(1, Math.min(Number(maxSessions) || 100, 500));
    this.sessions = new Map();
  }

  create({ operatorId, channel, metadata = {} } = {}) {
    const now = new Date().toISOString();
    const session = {
      id: `operator-session-${randomUUID().slice(0, 12)}`,
      operatorId: sanitizeMessage(String(operatorId || 'local-operator')),
      channel: channel || 'cli',
      createdAt: now,
      updatedAt: now,
      metadata: sanitizeAuditPayload(metadata),
    };
    this.sessions.set(session.id, session);
    while (this.sessions.size > this.maxSessions) {
      this.sessions.delete(this.sessions.keys().next().value);
    }
    return this.clone(session);
  }

  get(id) {
    return this.sessions.has(id) ? this.clone(this.sessions.get(id)) : null;
  }

  getOrCreate({ sessionId, operatorId, channel, metadata } = {}) {
    const existing = sessionId ? this.get(sessionId) : null;
    if (existing && existing.operatorId === sanitizeMessage(String(operatorId || 'local-operator'))) return existing;
    return this.create({ operatorId, channel, metadata });
  }

  touch(id, { lastIntent, metadata = {} } = {}) {
    const session = this.sessions.get(id);
    if (!session) return null;
    session.lastIntent = lastIntent || session.lastIntent;
    session.updatedAt = new Date().toISOString();
    session.metadata = sanitizeAuditPayload({
      ...session.metadata,
      ...metadata,
    });
    return this.clone(session);
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  clearForTests() {
    this.sessions.clear();
  }
}

module.exports = { OperatorSessionService };
