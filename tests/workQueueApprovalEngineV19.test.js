const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const {
  ApprovalEngineService,
  InternalWriteBoundary,
  MemoryInternalOperationsStore,
  WorkQueueService,
} = require('../src/core/work-queue');
const { materializeRecommendations } = require('../src/core/work-queue/RecommendationMaterializer');
const { createControlTowerFrontendAuth, sha256 } = require('../src/api/middleware/controlTowerFrontendAuth');
const { createControlTowerFounderActionAuth } = require('../src/api/middleware/controlTowerFounderActionAuth');

const actionState = {
  sourceMode: 'real_read_only',
  dataSource: 'cornermex_supabase',
  generatedAt: '2026-07-11T00:00:00.000Z',
  recommendedActions: [
    {
      id: 'catalog_validate_190_imported_drafts',
      type: 'catalog_review',
      title: 'Validate 190 imported Intermex draft products',
      description: '190 draft products are readable and remain inactive.',
      approvalRequired: false,
    },
    {
      id: 'quote_follow_up_123',
      type: 'quote_follow_up_draft',
      title: 'Review quote 123 follow-up',
      description: 'Prepare an internal follow-up draft.',
      approvalRequired: true,
    },
  ],
};

const harness = () => {
  const state = { workItems: [], approvals: [], auditEvents: [] };
  const store = new MemoryInternalOperationsStore({ state });
  const actionEngineService = { build: jest.fn().mockResolvedValue(actionState) };
  const workQueue = new WorkQueueService({
    actionEngineService,
    config: { cornermexOperatingStage: 'pre_launch', corneropsInternalSchema: 'cornerops_internal' },
    store,
  });
  return { actionEngineService, approvalEngine: new ApprovalEngineService({ store }), state, store, workQueue };
};

describe('CornerOps persistent Work Queue v1.9 domain', () => {
  test('materializes real recommendations and reuses the same unresolved work items', async () => {
    const { workQueue, state } = harness();
    const first = await workQueue.sync({ actorId: 'founder', correlationId: 'sync-1' });
    const second = await workQueue.sync({ actorId: 'founder', correlationId: 'sync-2' });
    expect(first).toMatchObject({ scannedRecommendations: 2, createdWorkItems: 2, reusedWorkItems: 0 });
    expect(second).toMatchObject({ scannedRecommendations: 2, createdWorkItems: 0, reusedWorkItems: 2 });
    expect(state.workItems).toHaveLength(2);
    expect(new Set(state.workItems.map((item) => item.idempotencyKey)).size).toBe(2);
  });

  test('concurrent synchronization cannot duplicate deterministic work items', async () => {
    const { workQueue, state } = harness();
    await Promise.all([
      workQueue.sync({ actorId: 'founder', correlationId: 'concurrent-a' }),
      workQueue.sync({ actorId: 'founder', correlationId: 'concurrent-b' }),
    ]);
    expect(state.workItems).toHaveLength(2);
  });

  test('a resolved condition reopens only after it clears and a later scan observes it again', async () => {
    const { actionEngineService, workQueue } = harness();
    await workQueue.sync({ correlationId: 'sync-open' });
    const [item] = await workQueue.list({ actionType: 'catalog_review' });
    const completed = await workQueue.update(item.id, {
      command: 'mark_manually_completed', version: item.version,
      reason: 'Founder completed the manual review.',
    }, { actorId: 'founder' });
    expect(completed.status).toBe('manually_completed');
    const unchanged = await workQueue.sync({ correlationId: 'sync-still-active' });
    expect(unchanged.reopenedWorkItems).toBe(0);
    expect(unchanged.skippedRecommendations).toBe(1);
    actionEngineService.build.mockResolvedValueOnce({ ...actionState, recommendedActions: actionState.recommendedActions.slice(1) });
    await workQueue.sync({ correlationId: 'sync-condition-cleared' });
    const returned = await workQueue.sync({ correlationId: 'sync-returned' });
    expect(returned.reopenedWorkItems).toBe(1);
  });

  test('optimistic concurrency rejects stale work item updates', async () => {
    const { workQueue } = harness();
    await workQueue.sync();
    const [item] = await workQueue.list({ actionType: 'catalog_review' });
    await workQueue.update(item.id, { command: 'set_priority', priority: 'high', version: 1 });
    await expect(workQueue.update(item.id, {
      command: 'set_priority', priority: 'low', version: 1,
    })).rejects.toMatchObject({ code: 'WORK_ITEM_VERSION_CONFLICT', statusCode: 409 });
  });

  test('manual completion and dismissal require a founder reason', async () => {
    const { workQueue } = harness();
    await workQueue.sync();
    const [item] = await workQueue.list({ actionType: 'catalog_review' });
    await expect(workQueue.update(item.id, {
      command: 'mark_manually_completed', version: item.version,
    })).rejects.toMatchObject({ code: 'WORK_ITEM_REASON_REQUIRED' });
    await expect(workQueue.update(item.id, {
      command: 'dismiss', version: item.version,
    })).rejects.toMatchObject({ code: 'WORK_ITEM_REASON_REQUIRED' });
  });

  test('approval records founder decision but never executes it', async () => {
    const { workQueue, approvalEngine, store } = harness();
    await workQueue.sync({ correlationId: 'approval-sync' });
    const [approval] = await approvalEngine.list({ status: 'pending' });
    const result = await approvalEngine.decide(approval.id, 'approved', {
      actorId: 'founder', reason: 'Reviewed the exact internal proposal.', correlationId: 'decision-1',
    });
    expect(result).toMatchObject({
      approved: true, executed: false, executionStatus: 'not_available_in_current_version',
      productionMutationsBlocked: true, externalSendsBlocked: true,
    });
    await expect(approvalEngine.decide(approval.id, 'approved', {
      reason: 'Duplicate decision.',
    })).rejects.toMatchObject({ code: 'APPROVAL_CONFLICT', statusCode: 409 });
    const events = await store.listAuditEvents();
    expect(events.some((event) => event.eventType === 'approval_approved')).toBe(true);
  });

  test('drafts are internal, persistent records and explicitly not sent', async () => {
    const { workQueue } = harness();
    await workQueue.sync();
    const drafts = await workQueue.listDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ sendStatus: 'DRAFT_NOT_SENT', externalSendAllowed: false });
  });

  test('new service instances retain shared store state like a durable adapter restart', async () => {
    const { store, workQueue } = harness();
    await workQueue.sync();
    const restartedService = new WorkQueueService({
      actionEngineService: { build: jest.fn().mockResolvedValue(actionState) },
      config: { corneropsInternalSchema: 'cornerops_internal' },
      store,
    });
    expect(await restartedService.list({})).toHaveLength(2);
    expect(await store.listApprovals({})).toHaveLength(1);
    expect((await store.listAuditEvents({})).length).toBeGreaterThan(0);
  });

  test('storage boundary rejects every namespace outside cornerops_internal allowlist', () => {
    const boundary = new InternalWriteBoundary();
    expect(boundary.assertTable('work_items')).toBe('cornerops_internal.work_items');
    expect(() => boundary.assertTable('products')).toThrow(expect.objectContaining({ code: 'INTERNAL_WRITE_TARGET_DENIED' }));
    expect(() => new InternalWriteBoundary({ schema: 'public' })).toThrow(expect.objectContaining({ code: 'INTERNAL_SCHEMA_DENIED' }));
  });
});

describe('Founder-action authentication v1.9', () => {
  const operatorToken = 'read-only-test-token';
  const founderToken = 'separate-founder-action-test-token';
  const config = {
    controlTowerFrontendApiEnabled: true,
    controlTowerFrontendReadOnly: true,
    controlTowerFrontendFailClosed: true,
    controlTowerFrontendMaskPii: true,
    controlTowerFrontendAuditRequests: true,
    controlTowerFrontendAuthRequired: true,
    controlTowerFrontendAuthMode: 'operator_token',
    controlTowerFrontendTokenHash: sha256(operatorToken),
    controlTowerFounderActionAuthRequired: true,
    controlTowerFounderActionTokenHash: sha256(founderToken),
    controlTowerFounderActionRateLimitPerMinute: 20,
  };

  const app = () => {
    const instance = express();
    instance.use(express.json({ limit: '4kb' }));
    instance.use(createControlTowerFrontendAuth(config));
    instance.get('/resource', (_req, res) => res.json({ ok: true }));
    instance.post('/resource', createControlTowerFounderActionAuth({ config }), (_req, res) => res.json({ ok: true }));
    return instance;
  };

  test('read-only operator token can GET but cannot POST alone', async () => {
    await request(app()).get('/resource').set('Authorization', `Bearer ${operatorToken}`).expect(200);
    const denied = await request(app()).post('/resource').set('Authorization', `Bearer ${operatorToken}`).send({}).expect(401);
    expect(denied.body.code).toBe('FOUNDER_ACTION_TOKEN_MISSING');
  });

  test('missing and invalid founder-action credentials fail closed', async () => {
    const invalid = await request(app()).post('/resource')
      .set('Authorization', `Bearer ${operatorToken}`)
      .set('x-cornerops-founder-action-token', 'invalid')
      .send({ command: 'dismiss' }).expect(403);
    expect(invalid.body.code).toBe('FOUNDER_ACTION_TOKEN_INVALID');
  });

  test('authentication denial is audited without exposing the credential', async () => {
    const recordAudit = jest.fn().mockResolvedValue(null);
    const instance = express();
    instance.use(express.json());
    instance.use(createControlTowerFrontendAuth(config));
    instance.post('/resource', createControlTowerFounderActionAuth({ config, recordAudit }), (_req, res) => res.json({ ok: true }));
    await request(instance).post('/resource')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({}).expect(401);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'authentication_denied',
      metadata: expect.objectContaining({ code: 'FOUNDER_ACTION_TOKEN_MISSING' }),
    }));
    expect(JSON.stringify(recordAudit.mock.calls)).not.toContain(operatorToken);
  });

  test('valid separate founder-action credential authorizes only internal write route', async () => {
    const response = await request(app()).post('/resource')
      .set('Authorization', `Bearer ${operatorToken}`)
      .set('x-cornerops-founder-action-token', founderToken)
      .send({ command: 'dismiss' }).expect(200);
    expect(response.body).toEqual({ ok: true });
    expect(JSON.stringify(response.body)).not.toContain(founderToken);
  });
});

describe('v1.9 migration safety', () => {
  test('migration is limited to private internal tables and append-only audit', () => {
    const sql = fs.readFileSync(path.join(
      __dirname, '../supabase/migrations/20260711190000_cornerops_internal_work_queue_v19.sql',
    ), 'utf8');
    expect(sql).toContain('create schema if not exists cornerops_internal');
    expect(sql).toContain('audit_events_append_only');
    expect(sql).toContain('revoke all on all tables in schema cornerops_internal');
    expect(sql).not.toMatch(/(?:insert into|update|delete from|alter table|truncate|drop table)\s+public\./i);
    expect(sql).not.toMatch(/public\.(products|orders|payments|customers|leads|inventory)/i);
  });
});
