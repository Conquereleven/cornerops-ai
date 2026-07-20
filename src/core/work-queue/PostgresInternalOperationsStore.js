const { Pool } = require('pg');
const fs = require('fs');
const { InternalWriteBoundary } = require('./InternalWriteBoundary');
const {
  OPEN_WORK_ITEM_STATUSES,
  WORK_ITEM_PRIORITIES,
  createWorkQueueError,
} = require('./workQueueTypes');

const camel = (row) => Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [
  key.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase()), value,
]));
const json = (value) => JSON.stringify(value || {});
const readDatabaseCa = (caPath) => {
  if (!caPath) return undefined;
  const certificate = fs.readFileSync(caPath, 'utf8');
  if (!certificate.includes('-----BEGIN CERTIFICATE-----')
    || !certificate.includes('-----END CERTIFICATE-----')) {
    throw createWorkQueueError(
      'CornerOps internal database CA certificate is invalid.',
      'INTERNAL_PERSISTENCE_CA_INVALID',
      503,
    );
  }
  return certificate;
};

class PostgresInternalOperationsStore {
  constructor({ connectionString, pool, schema = 'cornerops_internal', statementTimeoutMs = 8000, caPath } = {}) {
    if (!connectionString && !pool) {
      throw createWorkQueueError(
        'CornerOps internal database connection is not configured.',
        'INTERNAL_PERSISTENCE_CONFIGURATION_REQUIRED',
        503,
      );
    }
    this.boundary = new InternalWriteBoundary({ schema });
    const ca = readDatabaseCa(caPath);
    this.pool = pool || new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: statementTimeoutMs,
      statement_timeout: statementTimeoutMs,
      application_name: 'cornerops-internal-v1.9',
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    });
  }

  table(name) { return this.boundary.assertTable(name); }

  async health() {
    try {
      const result = await this.pool.query(
        `select to_regclass($1) is not null as ready`, [`${this.boundary.schema}.work_items`],
      );
      return {
        healthy: Boolean(result.rows[0]?.ready),
        provider: 'postgres',
        durable: true,
        schema: this.boundary.schema,
      };
    } catch (error) {
      return { healthy: false, provider: 'postgres', durable: true, errorCode: error.code || 'POSTGRES_UNAVAILABLE' };
    }
  }

  async withTransaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await callback(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async appendAudit(client, event) {
    const result = await client.query(
      `insert into ${this.table('audit_events')}
       (event_type, entity_type, entity_id, actor_type, actor_id, correlation_id, metadata)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb) returning *`,
      [event.eventType, event.entityType, event.entityId || null, event.actorType || 'system',
        event.actorId || null, event.correlationId || null, json(event.metadata)],
    );
    return camel(result.rows[0]);
  }

  async recordAuditEvent(event) {
    return this.withTransaction((client) => this.appendAudit(client, event));
  }

  async syncRecommendations(recommendations, context = {}) {
    return this.withTransaction((client) => this.syncRecommendationsWithClient(client, recommendations, context));
  }

  async syncRecommendationsWithClient(client, recommendations, context = {}) {
      const summary = {
        scannedRecommendations: recommendations.length,
        createdWorkItems: 0,
        reusedWorkItems: 0,
        reopenedWorkItems: 0,
        skippedRecommendations: 0,
        errors: [],
        items: [],
      };
      const activeKeys = recommendations.map((item) => item.idempotencyKey).filter(Boolean);
      const scopeSourceType = context.sourceType || 'action_engine';
      const scopeSourceId = context.sourceId || null;
      const cleared = await client.query(
        `update ${this.table('work_items')}
         set evidence=coalesce(evidence,'{}'::jsonb) || '{"conditionActive":false}'::jsonb,
             updated_at=now(), version=version+1
         where source_type=$2
           and ($3::text is null or source_id=$3)
           and not (idempotency_key = any($1::text[]))
           and coalesce((evidence->>'conditionActive')::boolean, true) is true
         returning id`,
        [activeKeys, scopeSourceType, scopeSourceId],
      );
      for (const clearedRow of cleared.rows) {
        await this.appendAudit(client, {
          eventType: 'work_item_condition_cleared', entityType: 'work_item',
          entityId: clearedRow.id, ...context,
        });
      }
      for (const recommendation of recommendations) {
        if (!recommendation.idempotencyKey || !recommendation.title || !recommendation.actionType) {
          summary.skippedRecommendations += 1;
          continue;
        }
        const inserted = await client.query(
          `insert into ${this.table('work_items')}
           (idempotency_key, source_type, source_id, source_flow, action_type, title, description,
            priority, status, operating_stage, owner_type, owner_id, approval_required,
            approval_status, evidence, safe_payload, due_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17)
           on conflict (idempotency_key) do nothing returning *`,
          [recommendation.idempotencyKey, recommendation.sourceType || 'action_engine',
            recommendation.sourceId || null, recommendation.sourceFlow || null,
            recommendation.actionType, recommendation.title, recommendation.description || null,
            WORK_ITEM_PRIORITIES.includes(recommendation.priority) ? recommendation.priority : 'medium',
            recommendation.approvalRequired ? 'queued_for_approval' : (recommendation.status || 'recommended'),
            recommendation.operatingStage || null, recommendation.ownerType || null,
            recommendation.ownerId || null, Boolean(recommendation.approvalRequired),
            recommendation.approvalRequired ? 'pending' : null, json(recommendation.evidence),
            json(recommendation.safePayload), recommendation.dueAt || null],
        );
        let row = inserted.rows[0];
        let eventType = 'work_item_created';
        if (row) {
          summary.createdWorkItems += 1;
        } else {
          const existing = await client.query(
            `select * from ${this.table('work_items')} where idempotency_key = $1 for update`,
            [recommendation.idempotencyKey],
          );
          row = existing.rows[0];
          if (OPEN_WORK_ITEM_STATUSES.includes(row.status)) {
            if (row.evidence?.conditionActive === false) {
              const refreshed = await client.query(
                `update ${this.table('work_items')}
                 set evidence=coalesce(evidence,'{}'::jsonb) || '{"conditionActive":true}'::jsonb,
                     updated_at=now(), version=version+1
                 where id=$1 returning *`,
                [row.id],
              );
              row = refreshed.rows[0];
              await this.appendAudit(client, {
                eventType: 'work_item_condition_returned', entityType: 'work_item',
                entityId: row.id, ...context,
              });
            }
            summary.reusedWorkItems += 1;
            eventType = 'work_item_reused';
          } else if (row.evidence?.conditionActive !== false) {
            summary.skippedRecommendations += 1;
            summary.items.push(camel(row));
            continue;
          } else {
            const reopened = await client.query(
              `update ${this.table('work_items')}
               set status=$2, approval_status=$3, completed_at=null, dismissed_at=null,
                   evidence=coalesce(evidence,'{}'::jsonb) || $4::jsonb,
                   updated_at=now(), version=version+1
               where id=$1 returning *`,
              [row.id, recommendation.approvalRequired ? 'queued_for_approval' : 'recommended',
                recommendation.approvalRequired ? 'pending' : null,
                json({ ...(recommendation.evidence || {}), conditionActive: true })],
            );
            row = reopened.rows[0];
            summary.reopenedWorkItems += 1;
            eventType = 'work_item_reopened';
          }
        }
        await this.appendAudit(client, {
          eventType, entityType: 'work_item', entityId: row.id, ...context,
          metadata: { idempotencyKey: recommendation.idempotencyKey },
        });
        if (recommendation.approvalRequired) {
          const approval = await client.query(
            `insert into ${this.table('approval_requests')}
             (work_item_id, approval_type, status, requested_by, requested_at)
             values ($1,$2,'pending',$3,now())
             on conflict (work_item_id) where status='pending' do nothing returning *`,
            [row.id, recommendation.actionType, context.actorId || 'system'],
          );
          if (approval.rows[0]) {
            await this.appendAudit(client, {
              eventType: 'approval_requested', entityType: 'approval_request',
              entityId: approval.rows[0].id, ...context, metadata: { workItemId: row.id },
            });
          }
        }
        summary.items.push(camel(row));
      }
      return summary;
  }

  async listWorkItems(filters = {}) {
    const clauses = [];
    const values = [];
    const add = (column, value) => {
      if (value === undefined || value === '') return;
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
    };
    add('status', filters.status);
    add('priority', filters.priority);
    add('source_flow', filters.sourceFlow);
    add('action_type', filters.actionType);
    add('approval_required', filters.approvalRequired);
    add('operating_stage', filters.operatingStage);
    add('owner_id', filters.owner);
    values.push(Math.max(1, Math.min(Number(filters.limit) || 100, 500)));
    const result = await this.pool.query(
      `select * from ${this.table('work_items')}
       ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
       order by created_at desc limit $${values.length}`,
      values,
    );
    return result.rows.map(camel);
  }

  async getWorkItem(id) {
    const result = await this.pool.query(
      `select * from ${this.table('work_items')} where id=$1`, [id],
    );
    return result.rows[0] ? camel(result.rows[0]) : null;
  }

  async updateWorkItem(id, command, context = {}) {
    const operations = {
      set_priority: ['priority', command.priority],
      assign_owner: ['owner_id', command.ownerId || 'founder'],
      set_due_date: ['due_at', command.dueAt || null],
      set_status: ['status', command.status],
      mark_manually_completed: ['status', 'manually_completed'],
      dismiss: ['status', 'dismissed'],
    };
    const operation = operations[command.command];
    if (!operation) throw createWorkQueueError('Work item command is not allowed.', 'WORK_ITEM_COMMAND_DENIED', 403);
    if (command.command === 'set_priority' && !WORK_ITEM_PRIORITIES.includes(command.priority)) {
      throw createWorkQueueError('Priority is invalid.', 'WORK_ITEM_PRIORITY_INVALID');
    }
    if (command.command === 'set_status'
      && !['recommended', 'drafted', 'in_progress', 'expired'].includes(command.status)) {
      throw createWorkQueueError('Status is invalid.', 'WORK_ITEM_STATUS_INVALID');
    }
    if (command.command === 'dismiss' && !String(command.reason || '').trim()) {
      throw createWorkQueueError('Dismissal reason is required.', 'WORK_ITEM_REASON_REQUIRED');
    }
    if (command.command === 'mark_manually_completed' && !String(command.reason || '').trim()) {
      throw createWorkQueueError('Completion reason is required.', 'WORK_ITEM_REASON_REQUIRED');
    }
    return this.withTransaction(async (client) => {
      const extra = command.command === 'mark_manually_completed'
        ? ', completed_at=now()'
        : command.command === 'dismiss' ? ', dismissed_at=now()'
          : command.command === 'assign_owner' ? ", owner_type='founder'" : '';
      const updated = await client.query(
        `update ${this.table('work_items')}
         set ${operation[0]}=$3, updated_at=now(), version=version+1${extra}
         where id=$1 and version=$2 returning *`,
        [id, Number(command.version), operation[1]],
      );
      if (!updated.rows[0]) {
        const exists = await client.query(`select 1 from ${this.table('work_items')} where id=$1`, [id]);
        if (!exists.rows[0]) return null;
        throw createWorkQueueError('Work item version is stale.', 'WORK_ITEM_VERSION_CONFLICT', 409);
      }
      await this.appendAudit(client, {
        eventType: `work_item_${command.command}`, entityType: 'work_item',
        entityId: id, ...context, metadata: { reason: command.reason, version: updated.rows[0].version },
      });
      return camel(updated.rows[0]);
    });
  }

  async listApprovals(filters = {}) {
    const values = [];
    const where = filters.status ? (values.push(filters.status), 'where status=$1') : '';
    values.push(Math.max(1, Math.min(Number(filters.limit) || 100, 500)));
    const result = await this.pool.query(
      `select * from ${this.table('approval_requests')} ${where}
       order by requested_at desc limit $${values.length}`,
      values,
    );
    return result.rows.map(camel);
  }

  async getApproval(id) {
    const result = await this.pool.query(
      `select * from ${this.table('approval_requests')} where id=$1`, [id],
    );
    return result.rows[0] ? camel(result.rows[0]) : null;
  }

  async decideApproval(id, decision, context = {}) {
    if (!['approved', 'rejected', 'cancelled'].includes(decision)) {
      throw createWorkQueueError('Approval decision is invalid.', 'APPROVAL_DECISION_INVALID');
    }
    if (!String(context.reason || '').trim()) {
      throw createWorkQueueError('Decision reason is required.', 'APPROVAL_REASON_REQUIRED');
    }
    return this.withTransaction(async (client) => {
      const result = await client.query(
        `update ${this.table('approval_requests')}
         set status=$2, decided_by=$3, decided_at=now(), decision_reason=$4, updated_at=now()
         where id=$1 and status='pending' returning *`,
        [id, decision, context.actorId || 'founder', context.reason],
      );
      if (!result.rows[0]) {
        const exists = await client.query(
          `select 1 from ${this.table('approval_requests')} where id=$1`, [id],
        );
        if (!exists.rows[0]) return null;
        throw createWorkQueueError('Approval is already resolved.', 'APPROVAL_CONFLICT', 409);
      }
      const approval = result.rows[0];
      await client.query(
        `update ${this.table('work_items')}
         set status=$2, approval_status=$3, updated_at=now(), version=version+1 where id=$1`,
        [approval.work_item_id, decision === 'approved' ? 'approved' : 'rejected', decision],
      );
      await this.appendAudit(client, {
        eventType: `approval_${decision}`, entityType: 'approval_request',
        entityId: id, ...context, metadata: { workItemId: approval.work_item_id, executed: false },
      });
      return camel(approval);
    });
  }

  async listAuditEvents(filters = {}) {
    const values = [];
    const where = filters.eventType ? (values.push(filters.eventType), 'where event_type=$1') : '';
    values.push(Math.max(1, Math.min(Number(filters.limit) || 100, 500)));
    const result = await this.pool.query(
      `select * from ${this.table('audit_events')} ${where}
       order by created_at desc limit $${values.length}`,
      values,
    );
    return result.rows.map(camel);
  }

  async metrics() {
    const result = await this.pool.query(
      `select
         count(*) filter (where status=any($1))::int as open_work_items,
         count(*) filter (where status=any($1) and priority in ('critical','high'))::int as high_priority_work_items,
         count(*) filter (where completed_at >= now()-interval '7 days')::int as completed_this_week,
         min(created_at) filter (where status=any($1)) as oldest_unresolved_at,
         count(*) filter (where status=any($1) and safe_payload->>'sendStatus' in ('not_sent','DRAFT_NOT_SENT'))::int as drafts_awaiting_review
       from ${this.table('work_items')}`,
      [OPEN_WORK_ITEM_STATUSES],
    );
    const approvals = await this.pool.query(
      `select count(*)::int as pending_approvals from ${this.table('approval_requests')} where status='pending'`,
    );
    return camel({ ...result.rows[0], ...approvals.rows[0] });
  }

  async close() { await this.pool.end(); }
}

module.exports = { PostgresInternalOperationsStore, camel, readDatabaseCa };
