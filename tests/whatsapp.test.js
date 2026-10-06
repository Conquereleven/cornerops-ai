process.env.NODE_ENV = 'test';
process.env.WHATSAPP_WEBHOOK_SECRET = 'test-whatsapp-app-secret';

const { createHmac } = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const { createWebhookSignatureVerifier } = require('../src/controllers/whatsappController');

const sign = (body) => `sha256=${createHmac('sha256', 'test-whatsapp-app-secret').update(body).digest('hex')}`;
const post = (payload, signature) => {
  const body = JSON.stringify(payload);
  const call = request(app).post('/api/webhooks/whatsapp').set('Content-Type', 'application/json');
  return (signature === undefined ? call : call.set('x-hub-signature-256', signature || sign(body))).send(body);
};

describe('WhatsApp webhook', () => {
  test('reports an unconfigured verification placeholder', async () => {
    const response = await request(app).get('/api/webhooks/whatsapp');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('placeholder');
  });

  test('maps a signed incoming payload through the chat orchestrator', async () => {
    const response = await post({
      from: `whatsapp-${Date.now()}`,
      text: '¿Tienen Tajín disponible?',
      requestId: `wamid-${Date.now()}`,
    }, '');

    expect(response.statusCode).toBe(200);
    expect(response.body.result.source).toBe('memory');
    expect(response.body.outgoing.type).toBe('text');
    expect(response.body.outgoing.metadata.worker).toBe('salesWorker');
  });

  test('rejects unsigned and wrongly signed payloads without processing them', async () => {
    const payload = { from: 'whatsapp-unsigned', text: 'hola' };
    expect((await post(payload)).statusCode).toBe(401);
    const forged = await post(payload, `sha256=${'0'.repeat(64)}`);
    expect(forged.statusCode).toBe(401);
    expect(forged.body.result).toBeUndefined();
  });

  test('fails closed when the webhook secret is not configured', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    createWebhookSignatureVerifier({ whatsappWebhookSecret: '' })({ get: () => 'sha256=x', rawBody: Buffer.from('{}') }, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});
