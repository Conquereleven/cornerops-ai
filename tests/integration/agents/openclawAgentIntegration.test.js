process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../../src/app');

describe('OpenClaw to Core Agent Pack integration', () => {
  test('OpenClaw message endpoint returns legacy adapter result and agent result', async () => {
    const response = await request(app).post('/api/openclaw/messages').send({
      channel: 'slack',
      userId: 'U123',
      text: 'Dame mi briefing de hoy',
      actionType: 'daily_briefing',
      requestId: 'agent-openclaw-api-test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.result.status).toBe('disabled');
    expect(response.body.agentResult).toMatchObject({
      agentId: 'daily-briefing-agent',
      status: 'dry_run',
    });
  });
});
