process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const aiWorkerRunRepository = require('../src/data/repositories/aiWorkerRunRepository');

describe('CornerOps chat API', () => {
  test('routes an order question to ordersWorker', async () => {
    const response = await request(app).post('/api/chat').send({
      userId: '1',
      message: '¿Cuál es el estado de mi orden #123?',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.reply).toBeDefined();
    expect(response.body.reply).toContain('orden #123');
    expect(response.body.worker).toBe('ordersWorker');
    expect(response.body.intent).toBe('order_status');
    expect(response.body.conversationId).toMatch(/^conv-/);
    expect(response.body.metadata.orderId).toBe('123');
    expect(response.body.intentCategory).toBe('orders');
    expect(response.body.memorySummary.orderId).toBe('123');
    expect(response.body.source).toBe('memory');
    const runs = await aiWorkerRunRepository.listWorkerRuns({
      worker: 'ordersWorker',
      intent: 'order_status',
    });
    expect(runs.some((run) => run.conversationId === response.body.conversationId)).toBe(true);
  });

  test('rejects an incomplete request', async () => {
    const response = await request(app).post('/api/chat').send({
      userId: '1',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(true);
    expect(response.body.message).toMatch(/message/);
  });

  test('rejects a request without userId', async () => {
    const response = await request(app).post('/api/chat').send({
      message: 'Hola',
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/userId/);
  });

  test('keeps the supplied conversation context', async () => {
    const first = await request(app).post('/api/chat').send({
      userId: '1',
      message: 'Hola',
    });
    const second = await request(app).post('/api/chat').send({
      userId: '1',
      message: '¿Tienen Tajín disponible?',
      conversationId: first.body.conversationId,
    });

    expect(second.body.conversationId).toBe(first.body.conversationId);
    expect(second.body.memorySummary.productName).toContain('Tajín');
  });

  test('uses saved order context in an ambiguous follow-up', async () => {
    const userId = `memory-${Date.now()}`;
    const first = await request(app).post('/api/chat').send({
      userId,
      message: 'Revisa mi orden #123',
    });
    const second = await request(app).post('/api/chat').send({
      userId,
      conversationId: first.body.conversationId,
      message: '¿Y para cuándo?',
    });

    expect(second.body.worker).toBe('ordersWorker');
    expect(second.body.metadata.orderId).toBe('123');
    expect(second.body.memorySummary.lastIntent).toBe('order_status');
  });

  test('routes an ambiguous new request as unknown', async () => {
    const response = await request(app).post('/api/chat').send({
      userId: 'unknown-user',
      message: 'xyz sin contexto',
    });
    expect(response.body.intent).toBe('unknown');
    expect(response.body.intentCategory).toBe('unknown');
  });

  test('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('returns the compatible API health alias', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.dataSource.mode).toBe('mock');
  });

  test('replays an idempotent request without duplicating messages', async () => {
    const userId = `idempotent-${Date.now()}`;
    const payload = {
      userId,
      message: '¿Tienen Tajín disponible?',
      requestId: `request-${Date.now()}`,
    };
    const first = await request(app).post('/api/chat').send(payload);
    const second = await request(app).post('/api/chat').send(payload);
    const messages = await request(app).get(
      `/api/conversations/${first.body.conversationId}/messages`,
    );

    expect(second.body.conversationId).toBe(first.body.conversationId);
    expect(second.body.idempotentReplay).toBe(true);
    expect(messages.body).toHaveLength(2);
  });
});
