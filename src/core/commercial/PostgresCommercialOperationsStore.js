const { commercialError } = require('./commercialTypes');

const camel = (row) => Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [
  key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase()), value,
]));

class PostgresCommercialOperationsStore {
  constructor({ internalStore } = {}) {
    if (!internalStore?.pool || typeof internalStore.withTransaction !== 'function') {
      throw commercialError('Durable internal persistence is required.', 'COMMERCIAL_PERSISTENCE_REQUIRED', 503);
    }
    this.internalStore = internalStore;
  }
  table(name) { return this.internalStore.table(name); }
  async health() {
    const result = await this.internalStore.pool.query('select to_regclass($1) is not null as ready', [`${this.internalStore.boundary.schema}.commercial_entities`]);
    return { healthy: Boolean(result.rows[0]?.ready), provider: 'postgres', durable: true };
  }
  async get(kind, stableKey) {
    const result = await this.internalStore.pool.query(
      `select payload from ${this.table('commercial_entities')} where entity_type=$1 and stable_key=$2`, [kind, stableKey],
    );
    return result.rows[0]?.payload || null;
  }
  async list(kind) {
    const result = await this.internalStore.pool.query(
      `select payload from ${this.table('commercial_entities')} where entity_type=$1 order by created_at desc limit 500`, [kind],
    );
    return result.rows.map((row) => row.payload);
  }
  async create(kind, stableKey, payload, context = {}) {
    return this.internalStore.withTransaction(async (client) => {
      const timestamp = new Date().toISOString();
      const record = { ...payload, createdAt: payload.createdAt || timestamp, updatedAt: payload.updatedAt || timestamp, version: 1 };
      const inserted = await client.query(
        `insert into ${this.table('commercial_entities')} (entity_type,stable_key,payload)
         values($1,$2,$3::jsonb) on conflict(entity_type,stable_key) do nothing returning *`,
        [kind, stableKey, JSON.stringify(record)],
      );
      let row = inserted.rows[0];
      if (!row) {
        const existing = await client.query(
          `select * from ${this.table('commercial_entities')} where entity_type=$1 and stable_key=$2`, [kind, stableKey],
        );
        return { record: existing.rows[0].payload, created: false };
      }
      await this.appendTransition(client, kind, stableKey, null, record.status || 'CREATED', context);
      await this.internalStore.appendAudit(client, {
        eventType: `${kind}_created`, entityType: kind, entityId: row.id,
        actorType: 'founder', actorId: context.actorId, correlationId: context.correlationId,
        metadata: { stableKey, sanitized: true },
      });
      return { record: row.payload, created: true };
    });
  }
  async update(kind, stableKey, updater, context = {}) {
    return this.internalStore.withTransaction(async (client) => {
      const selected = await client.query(
        `select * from ${this.table('commercial_entities')} where entity_type=$1 and stable_key=$2 for update`, [kind, stableKey],
      );
      if (!selected.rows[0]) return null;
      const previous = selected.rows[0];
      const next = { ...updater(previous.payload), updatedAt: new Date().toISOString(), version: previous.version + 1 };
      const updated = await client.query(
        `update ${this.table('commercial_entities')} set payload=$3::jsonb,version=version+1,updated_at=now()
         where entity_type=$1 and stable_key=$2 returning *`, [kind, stableKey, JSON.stringify(next)],
      );
      await this.appendTransition(client, kind, stableKey, previous.payload.status || null, next.status || null, context);
      await this.internalStore.appendAudit(client, {
        eventType: `${kind}_transition`, entityType: kind, entityId: updated.rows[0].id,
        actorType: 'founder', actorId: context.actorId, correlationId: context.correlationId,
        metadata: { previousState: previous.payload.status || null, newState: next.status || null, reason: context.reason, sanitized: true },
      });
      return { ...updated.rows[0].payload, version: updated.rows[0].version, updatedAt: updated.rows[0].updated_at };
    });
  }
  async appendTransition(client, kind, stableKey, previousState, newState, context = {}) {
    await client.query(
      `insert into ${this.table('commercial_transition_events')}
       (entity_type,entity_stable_key,previous_state,new_state,actor_id,reason,evidence,correlation_id)
       values($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [kind, stableKey, previousState, newState, context.actorId || 'system', context.reason || 'internal_operation', JSON.stringify(context.evidence || {}), context.correlationId || null],
    );
  }
  async listTransitions(filters = {}) {
    const values = [];
    const clauses = [];
    if (filters.entityType) { values.push(filters.entityType); clauses.push(`entity_type=$${values.length}`); }
    if (filters.entityId) { values.push(filters.entityId); clauses.push(`entity_stable_key=$${values.length}`); }
    const result = await this.internalStore.pool.query(
      `select * from ${this.table('commercial_transition_events')} ${clauses.length ? `where ${clauses.join(' and ')}` : ''} order by created_at desc limit 500`, values,
    );
    return result.rows.map(camel);
  }
  async claimEvidence(record) {
    return this.internalStore.withTransaction(async (client) => {
      const inserted = await client.query(
        `insert into ${this.table('commercial_evidence_registry')}
         (evidence_fingerprint,evidence_id,source_type,source_reference,evidence_unit_reference,
          subject_type,subject_id,order_id,fulfillment_id,payment_method,previous_state,new_state,
          amount_minor,currency,evidence_timestamp,checksum,verification_status,actor_id,result_entity_id)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         on conflict(evidence_fingerprint) do nothing returning *`,
        [record.evidenceFingerprint, record.evidenceId, record.sourceType, record.sourceReference,
          record.evidenceUnitReference || null, record.subjectType, record.subjectId, record.orderId || null,
          record.fulfillmentId || null, record.paymentMethod || null, record.previousState || null,
          record.newState, record.amountMinor ?? null, record.currency || null, record.evidenceTimestamp,
          record.checksum, record.verificationStatus, record.actor, record.resultEntityId || null],
      );
      if (inserted.rows[0]) return { record: camel(inserted.rows[0]), created: true };
      const existing = await client.query(
        `select * from ${this.table('commercial_evidence_registry')} where evidence_fingerprint=$1`,
        [record.evidenceFingerprint],
      );
      return { record: camel(existing.rows[0]), created: false };
    });
  }
  async listEvidence() {
    const result = await this.internalStore.pool.query(
      `select * from ${this.table('commercial_evidence_registry')} order by recorded_at desc limit 500`,
    );
    return result.rows.map(camel);
  }
}

module.exports = { PostgresCommercialOperationsStore };
