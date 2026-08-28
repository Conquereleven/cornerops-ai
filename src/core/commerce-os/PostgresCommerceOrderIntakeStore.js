const { commerceOsError } = require('./commerceOsTypes');

const camel = (row) => Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [
  key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase()), value,
]));
const mapRecord = (row) => row && ({
  ...camel(row), assessment: { status: row.assessment_status, issues: row.assessment_issues }, canonicalOrder: row.canonical_order,
});

class PostgresCommerceOrderIntakeStore {
  constructor({ internalStore } = {}) {
    if (!internalStore?.pool || typeof internalStore.withTransaction !== 'function') {
      throw commerceOsError('Durable internal persistence is required.', 'COMMERCE_OS_ORDER_PERSISTENCE_REQUIRED');
    }
    this.internalStore = internalStore;
  }
  table(name) { return this.internalStore.table(name); }
  async health() {
    try {
      const result = await this.internalStore.pool.query(
        'select to_regclass($1) is not null as intake_ready,to_regclass($2) is not null as events_ready',
        [`${this.internalStore.boundary.schema}.commerce_order_intakes`, `${this.internalStore.boundary.schema}.commerce_order_intake_events`],
      );
      return { healthy: result.rows[0]?.intake_ready === true && result.rows[0]?.events_ready === true, provider: 'postgres', durable: true };
    } catch (_error) { return { healthy: false, provider: 'postgres', durable: true, reason: 'COMMERCE_OS_ORDER_PERSISTENCE_PROBE_ERROR' }; }
  }
  async ingest(input, context = {}) {
    const { order, assessment, fingerprint, sourceKey } = input;
    return this.internalStore.withTransaction(async (client) => {
      await client.query("select set_config('app.current_tenant_id',$1,true)", [order.tenantId]);
      await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [sourceKey]);
      const selected = await client.query(
        `select * from ${this.table('commerce_order_intakes')}
         where tenant_id=$1 and source_system=$2 and external_order_id=$3 for update`,
        [order.tenantId, order.source.system, order.source.externalOrderId],
      );
      const previous = selected.rows[0];
      const sourceUpdatedAt = order.source.externalUpdatedAt || order.createdAt;
      let row;
      let eventType;
      let idempotentReplay = false;
      let conflict = false;
      if (!previous) {
        const inserted = await client.query(
          `insert into ${this.table('commerce_order_intakes')}
           (tenant_id,source_system,external_order_id,source_key,source_updated_at,fingerprint,revision,
            assessment_status,assessment_issues,canonical_order,actor_id,correlation_id)
           values($1,$2,$3,$4,$5,$6,1,$7,$8::jsonb,$9::jsonb,$10,$11) returning *`,
          [order.tenantId, order.source.system, order.source.externalOrderId, sourceKey, sourceUpdatedAt, fingerprint,
            assessment.status, JSON.stringify(assessment.issues), JSON.stringify(order), context.actorId, context.correlationId || null],
        );
        row = inserted.rows[0]; eventType = 'order_intake_created';
      } else if (previous.fingerprint === fingerprint) {
        row = previous; eventType = 'order_intake_idempotent_replay'; idempotentReplay = true;
      } else if (Date.parse(sourceUpdatedAt) <= Date.parse(previous.source_updated_at)) {
        row = previous; eventType = 'order_intake_source_version_conflict'; conflict = true;
      } else {
        const updated = await client.query(
          `update ${this.table('commerce_order_intakes')} set
             source_updated_at=$2,fingerprint=$3,revision=revision+1,assessment_status=$4,
             assessment_issues=$5::jsonb,canonical_order=$6::jsonb,actor_id=$7,correlation_id=$8,received_at=now()
           where id=$1 returning *`,
          [previous.id, sourceUpdatedAt, fingerprint, assessment.status, JSON.stringify(assessment.issues),
            JSON.stringify(order), context.actorId, context.correlationId || null],
        );
        row = updated.rows[0]; eventType = 'order_intake_revised';
      }
      await client.query(
        `insert into ${this.table('commerce_order_intake_events')}
         (order_intake_id,tenant_id,event_type,previous_fingerprint,new_fingerprint,revision,actor_id,correlation_id,metadata)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
        [row.id, order.tenantId, eventType, previous?.fingerprint || null, fingerprint, row.revision,
          context.actorId, context.correlationId || null, JSON.stringify({ sourceSystem: order.source.system, externalOrderId: order.source.externalOrderId, assessmentStatus: assessment.status, externalWritesPerformed: false })],
      );
      await this.internalStore.appendAudit(client, {
        eventType, entityType: 'commerce_order_intake', entityId: row.id, actorType: 'operator',
        actorId: context.actorId, correlationId: context.correlationId,
        metadata: { tenantId: order.tenantId, sourceKey, revision: row.revision, assessmentStatus: assessment.status, sanitized: true, externalWritesPerformed: false },
      });
      return { record: mapRecord(row), idempotentReplay, conflict };
    });
  }
  async get({ tenantId, sourceSystem, externalOrderId }) {
    return this.internalStore.withTransaction(async (client) => {
      await client.query("select set_config('app.current_tenant_id',$1,true)", [tenantId]);
      const result = await client.query(
        `select * from ${this.table('commerce_order_intakes')} where tenant_id=$1 and source_system=$2 and external_order_id=$3`,
        [tenantId, sourceSystem, externalOrderId],
      );
      return mapRecord(result.rows[0]);
    });
  }
}

module.exports = { PostgresCommerceOrderIntakeStore };
