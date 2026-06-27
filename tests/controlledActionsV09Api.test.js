const request = require('supertest');

process.env.CORNEROPS_WEB_CONSOLE_ENABLED = 'true';
process.env.CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH = 'true';
process.env.CORNEROPS_WEB_CONSOLE_AUTH_TOKEN = 'v09-test-console-token';
process.env.CORNEROPS_CONTROLLED_ACTIONS_ENABLED = 'true';
process.env.CORNEROPS_CONTROLLED_ACTIONS_DRY_RUN = 'true';
process.env.CORNEROPS_CONTROLLED_ACTIONS_REQUIRE_APPROVAL = 'true';
process.env.CORNEROPS_CONTROLLED_ACTIONS_FAIL_CLOSED = 'true';
process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_ENABLED = 'true';
process.env.CORNEROPS_ACTION_GITHUB_ISSUE_CREATE_DRY_RUN = 'true';
process.env.CORNEROPS_ACTION_INTERNAL_NOTE_CREATE_ENABLED = 'true';
process.env.CORNEROPS_ACTION_INTERNAL_TASK_CREATE_ENABLED = 'true';
process.env.GITHUB_ENABLED = 'false';
process.env.GITHUB_READ_ONLY = 'true';
process.env.GITHUB_DRY_RUN = 'true';
process.env.GITHUB_ALLOW_ISSUE_CREATION = 'false';

const app = require('../src/app');
const token = { 'x-cornerops-console-token': 'v09-test-console-token', 'x-operator-id': 'founder-api-test' };

describe('Controlled Actions v0.9 API', () => {
  test('requires local console authentication and lists only allowlisted actions', async () => {
    await request(app).get('/api/actions').expect(401);
    const response = await request(app).get('/api/actions').set(token).expect(200);
    expect(response.body).toMatchObject({ enabled: true, dryRun: true, requireApproval: true });
    expect(response.body.actions.map((action) => action.id)).toEqual([
      'github.issue.create', 'cornerops.note.create', 'cornerops.task.create',
    ]);
    await request(app).get('/api/actions/orders.mark_paid').set(token).expect(404);
  });

  test('creates a GitHub draft, requests approval and executes only dry-run', async () => {
    const payload = {
      title: 'Manual payment audit IDs',
      body: 'Show audit IDs for manual payment orders.',
      sourceRequestId: 'api-request-1',
    };
    await request(app).post('/api/actions/github/issues/draft').set(token).send(payload).expect(200)
      .then((response) => expect(response.body).toMatchObject({ status: 'draft', dryRun: true }));
    const requested = await request(app).post('/api/actions/github/issues/request-approval')
      .set(token).send(payload).expect(202);
    await request(app).post(`/api/control-tower/v0.8/approvals/${requested.body.approvalId}/approve-dry-run`)
      .set(token).send({}).expect(200);
    const executed = await request(app).post(`/api/actions/approvals/${requested.body.approvalId}/execute-dry-run`)
      .set(token).send({}).expect(200);
    expect(executed.body).toMatchObject({ status: 'dry_run_executed', dryRun: true });
    const duplicate = await request(app).post(`/api/actions/approvals/${requested.body.approvalId}/execute-dry-run`)
      .set(token).send({}).expect(200);
    expect(duplicate.body).toMatchObject({ duplicate: true });
  });

  test('blocks real execution, secrets and payment/order action ids', async () => {
    await request(app).post('/api/actions/github/issues/draft').set(token).send({
      title: 'Unsafe', body: `Bearer ${['gh', 'p_'].join('')}abcdefghijklmnopqrstuvwxyz123456`,
    }).expect(400);
    const requested = await request(app).post('/api/actions/internal-tasks/request-approval').set(token).send({
      title: 'Review stale B2B leads', description: 'Read-only review.', sourceRequestId: 'api-request-2',
    }).expect(202);
    await request(app).post(`/api/control-tower/v0.8/approvals/${requested.body.approvalId}/approve-dry-run`)
      .set(token).send({}).expect(200);
    await request(app).post(`/api/actions/approvals/${requested.body.approvalId}/execute`)
      .set(token).send({}).expect(403);
    await request(app).post('/api/actions/approvals/approval-does-not-exist/execute')
      .set(token).send({ actionId: 'orders.mark_paid' }).expect(404);
  });

  test('Control Tower v0.9 reports action and idempotency state', async () => {
    const response = await request(app).get('/api/control-tower/v0.9/status').set(token).expect(200);
    expect(response.body).toMatchObject({
      version: 'v0.9',
      controlledActions: {
        enabled: true,
        dryRun: true,
        realExecutionAllowed: false,
        idempotency: { healthy: true },
      },
      safety: {
        paymentOrderLeadQuoteMutationsBlocked: true,
        controlledActionsRealExecutionBlocked: true,
      },
    });
  });
});
