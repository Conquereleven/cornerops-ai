process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('OpenClaw internal API', () => {
  test('reports disabled health by default', async () => {
    const response = await request(app).get('/api/openclaw/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.enabled).toBe(false);
    expect(response.body.dryRun).toBe(true);
  });

  test('routes a safe dry-run message without calling real channels', async () => {
    const response = await request(app).post('/api/openclaw/messages').send({
      channel: 'slack',
      userId: 'U123',
      text: 'Dame mi briefing de hoy',
      actionType: 'daily_briefing',
      requestId: 'openclaw-api-test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.routed.channel).toBe('slack');
    expect(response.body.result.status).toBe('disabled');
    expect(response.body.result.dryRun).toBe(true);
  });

  test('creates and resolves approvals', async () => {
    const created = await request(app).post('/api/openclaw/approvals').send({
      actionType: 'send_email',
      channel: 'slack',
      createdBy: 'operator',
      reason: 'Needs human approval',
      payload: { to: 'supplier@example.com' },
    });
    const fetched = await request(app)
      .get(`/api/openclaw/approvals/${created.body.id}`);
    const approved = await request(app)
      .post(`/api/openclaw/approvals/${created.body.id}/approve`)
      .send({ approver: 'operator' });

    expect(created.statusCode).toBe(201);
    expect(fetched.body.status).toBe('pending');
    expect(approved.body.status).toBe('approved');
  });
});
