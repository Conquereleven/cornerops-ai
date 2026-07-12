const request = require('supertest');
const crypto = require('crypto');

const operatorToken = 'api-read-token-v19';
const founderToken = 'api-founder-token-v19';
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

process.env.CONTROL_TOWER_FRONTEND_API_ENABLED = 'true';
process.env.CONTROL_TOWER_FRONTEND_AUTH_REQUIRED = 'true';
process.env.CONTROL_TOWER_FRONTEND_READ_ONLY = 'true';
process.env.CONTROL_TOWER_FRONTEND_FAIL_CLOSED = 'true';
process.env.CONTROL_TOWER_FRONTEND_MASK_PII = 'true';
process.env.CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS = 'true';
process.env.CONTROL_TOWER_FRONTEND_TOKEN_HASH = sha256(operatorToken);
process.env.CONTROL_TOWER_FOUNDER_ACTION_AUTH_REQUIRED = 'true';
process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH = sha256(founderToken);
process.env.CONTROL_TOWER_FOUNDER_ACTION_RATE_LIMIT_PER_MINUTE = '100';

const controller = require('../src/controllers/intelligenceController');
const app = require('../src/app');

const operator = (call) => call.set('Authorization', `Bearer ${operatorToken}`);
const founder = (call) => operator(call).set('x-cornerops-founder-action-token', founderToken);

describe('Work Queue API v1.9', () => {
  beforeEach(() => {
    jest.spyOn(controller.workQueueService, 'status').mockResolvedValue({
      status: 'ready',
      persistence: { healthy: true, durable: true, provider: 'postgres' },
      metrics: { openWorkItems: 1 },
      internalSchema: 'cornerops_internal',
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    });
    jest.spyOn(controller.workQueueService, 'list').mockResolvedValue([{
      id: 'work-1', title: 'Internal review', status: 'recommended', version: 1,
    }]);
    jest.spyOn(controller.workQueueService, 'sync').mockResolvedValue({
      scannedRecommendations: 1,
      createdWorkItems: 1,
      reusedWorkItems: 0,
      reopenedWorkItems: 0,
      skippedRecommendations: 0,
      errors: [],
    });
    jest.spyOn(controller.workQueueService, 'update').mockResolvedValue({
      id: 'work-1', status: 'manually_completed', version: 2,
    });
    jest.spyOn(controller.approvalEngineService, 'list').mockResolvedValue([{
      id: 'approval-1', workItemId: 'work-1', status: 'pending',
    }]);
    jest.spyOn(controller.approvalEngineService, 'decide').mockResolvedValue({
      approval: { id: 'approval-1', status: 'approved', decisionReason: 'Reviewed.' },
      approved: true,
      executed: false,
      executionStatus: 'not_available_in_current_version',
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    });
  });

  afterEach(() => jest.restoreAllMocks());

  test('operator read token can list persistent work items', async () => {
    const response = await operator(request(app).get('/api/intelligence/work-queue')).expect(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.persistence).toMatchObject({ provider: 'postgres', durable: true });
  });

  test('operator read token cannot synchronize or patch without founder token', async () => {
    const sync = await operator(request(app).post('/api/intelligence/work-queue/sync')).send({}).expect(401);
    expect(sync.body.code).toBe('FOUNDER_ACTION_TOKEN_MISSING');
    await operator(request(app).patch('/api/intelligence/work-queue/work-1'))
      .send({ command: 'mark_manually_completed', version: 1, reason: 'Reviewed.' })
      .expect(401);
  });

  test('separate founder token authorizes internal sync without external execution', async () => {
    const response = await founder(request(app).post('/api/intelligence/work-queue/sync'))
      .send({}).expect(202);
    expect(response.body).toMatchObject({
      createdWorkItems: 1,
      executedExternalAction: false,
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    });
  });

  test('PATCH uses explicit command and returns internal state only', async () => {
    const response = await founder(request(app).patch('/api/intelligence/work-queue/work-1'))
      .send({ command: 'mark_manually_completed', version: 1, reason: 'Founder verified.' })
      .expect(200);
    expect(response.body.item).toMatchObject({ status: 'manually_completed', version: 2 });
    expect(JSON.stringify(response.body)).not.toContain(founderToken);
  });

  test('approval endpoint records an internal decision and never executes it', async () => {
    const listed = await operator(request(app).get('/api/intelligence/approvals')).expect(200);
    expect(listed.body.approvals).toHaveLength(1);
    const decision = await founder(request(app).post('/api/intelligence/approvals/approval-1/approve'))
      .send({ reason: 'Reviewed.' }).expect(200);
    expect(decision.body).toMatchObject({
      approved: true,
      executed: false,
      executionStatus: 'not_available_in_current_version',
    });
  });
});
