const { randomUUID } = require('crypto');
const { sanitizeAuditPayload, sanitizeMessage } = require('../security/SecuritySanitizer');
const { InMemoryStore } = require('../persistence/InMemoryStore');

const initialData = { version: 1, records: [] };

class OperatorSessionService {
  constructor({ maxSessions = 100, store = new InMemoryStore({ initialData }) } = {}) {
    this.maxSessions = Math.max(1, Math.min(Number(maxSessions) || 100, 500));
    this.store = store;
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
    this.store.transact((current) => ({
      data: {
        version: 1,
        records: [session, ...(Array.isArray(current.records) ? current.records : [])]
          .slice(0, this.maxSessions),
      },
      result: session,
    }));
    return this.clone(session);
  }

  get(id) {
    const session = this.store.initialize().records.find((item) => item.id === id);
    return session ? this.clone(session) : null;
  }

  getOrCreate({ sessionId, operatorId, channel, metadata } = {}) {
    const existing = sessionId ? this.get(sessionId) : null;
    if (existing && existing.operatorId === sanitizeMessage(String(operatorId || 'local-operator'))) return existing;
    return this.create({ operatorId, channel, metadata });
  }

  touch(id, { lastIntent, metadata = {} } = {}) {
    return this.store.transact((current) => {
      const records = Array.isArray(current.records) ? current.records : [];
      const index = records.findIndex((item) => item.id === id);
      if (index === -1) return { data: current, result: null };
      records[index] = {
        ...records[index],
        lastIntent: lastIntent || records[index].lastIntent,
        updatedAt: new Date().toISOString(),
        metadata: sanitizeAuditPayload({
          ...records[index].metadata,
          ...metadata,
        }),
      };
      return { data: { version: 1, records }, result: records[index] };
    });
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  clearForTests() {
    this.store.clear();
  }
}

module.exports = { OperatorSessionService };
