process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('WhatsApp webhook placeholder', () => {
  test('reports an unconfigured verification placeholder', async () => {
    const response = await request(app).get('/api/webhooks/whatsapp');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('placeholder');
  });

  test('maps a safe incoming payload through the chat orchestrator', async () => {
    const response = await request(app).post('/api/webhooks/whatsapp').send({
      from: `whatsapp-${Date.now()}`,
      text: '¿Tienen Tajín disponible?',
      requestId: `wamid-${Date.now()}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.result.source).toBe('memory');
    expect(response.body.outgoing.type).toBe('text');
    expect(response.body.outgoing.metadata.worker).toBe('salesWorker');
  });
});
