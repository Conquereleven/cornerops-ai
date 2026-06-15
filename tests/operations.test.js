process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('CornerOps operations API', () => {
  test('returns the command center snapshot', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.statusCode).toBe(200);
    expect(response.body.metrics.totalWorkers).toBe(6);
    expect(response.body.workers).toHaveLength(6);
    expect(response.body.events.length).toBeGreaterThan(0);
    expect(response.body.handoffs.every((item) => item.status === 'waiting')).toBe(true);
    expect(response.body.metrics.humanHandoffs).toBeGreaterThanOrEqual(
      response.body.handoffs.length,
    );
  });

  test('persists worker configuration and restores it', async () => {
    const initial = await request(app).get('/api/workers');
    const worker = initial.body.find((item) => item.id === 'supportWorker');

    const updated = await request(app)
      .patch('/api/workers/supportWorker')
      .send({ enabled: false, prompt: 'Prompt de prueba' });

    expect(updated.statusCode).toBe(200);
    expect(updated.body.status).toBe('inactive');
    expect(updated.body.prompt).toBe('Prompt de prueba');

    await request(app)
      .patch('/api/workers/supportWorker')
      .send({ enabled: worker.enabled, prompt: worker.prompt, model: worker.model });
  });

  test('creates and resolves a human handoff through chat telemetry', async () => {
    const chat = await request(app).post('/api/chat').send({
      userId: `handoff-${Date.now()}`,
      message: 'Quiero hablar con una persona',
    });
    expect(chat.statusCode).toBe(200);

    const queue = await request(app).get('/api/handoffs?status=waiting');
    const handoff = queue.body.find((item) => item.conversationId === chat.body.conversationId);
    expect(handoff).toBeDefined();

    const resolved = await request(app)
      .patch(`/api/handoffs/${handoff.id}`)
      .send({ status: 'resolved', notes: 'Atendido en prueba' });
    expect(resolved.body.status).toBe('resolved');
  });

  test('updates integrations and workspace settings', async () => {
    const integrations = await request(app).get('/api/integrations');
    const email = integrations.body.find((item) => item.id === 'email');

    const integration = await request(app)
      .patch('/api/integrations/email')
      .send({ status: 'connected' });
    expect(integration.body.status).toBe('connected');

    const originalSettings = (await request(app).get('/api/settings')).body;
    const settings = await request(app)
      .put('/api/settings')
      .send({ operatorName: 'QA Operator', languages: ['es', 'en'] });
    expect(settings.body.operatorName).toBe('QA Operator');

    await request(app).patch('/api/integrations/email').send({ status: email.status });
    await request(app).put('/api/settings').send(originalSettings);
  });

  test('returns 404 for unknown operation resources', async () => {
    const worker = await request(app).patch('/api/workers/not-found').send({ enabled: true });
    const handoff = await request(app).patch('/api/handoffs/not-found').send({ status: 'resolved' });

    expect(worker.statusCode).toBe(404);
    expect(handoff.statusCode).toBe(404);
  });
});
