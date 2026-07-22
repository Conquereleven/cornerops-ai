const crypto = require('crypto');
const request = require('supertest');
const fixture = require('./fixtures/commercial/commercial-input-v117a.json');

const operatorToken = 'test-operator-token-v117a';
const founderToken = 'test-founder-action-token-v117a';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

describe('CO-1.17A authenticated commercial API boundary', () => {
  let app;
  beforeAll(() => {
    process.env.CONTROL_TOWER_FRONTEND_TOKEN_HASH = hash(operatorToken);
    process.env.CONTROL_TOWER_FRONTEND_API_ENABLED = 'true';
    process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH = hash(founderToken);
    process.env.CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';
    process.env.CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED = 'true';
    process.env.CORNEROPS_INTERNAL_PERSISTENCE_ENABLED = 'false';
    jest.resetModules();
    app = require('../src/app');
  });
  afterAll(() => {
    delete process.env.CONTROL_TOWER_FRONTEND_TOKEN_HASH;
    delete process.env.CONTROL_TOWER_FRONTEND_API_ENABLED;
    delete process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH;
    delete process.env.CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS;
    delete process.env.CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED;
    delete process.env.CORNEROPS_INTERNAL_PERSISTENCE_ENABLED;
  });

  const auth = (call) => call.set('Authorization', `Bearer ${operatorToken}`);
  const founder = (call) => auth(call)
    .set('Origin', 'http://127.0.0.1:5173')
    .set('x-cornerops-founder-action-token', founderToken)
    .set('x-operator-id', 'founder-test')
    .set('Content-Type', 'application/json');

  test('operator auth protects commercial reads', async () => {
    await request(app).get('/api/intelligence/commercial/status').expect(401);
    const response = await auth(request(app).get('/api/intelligence/commercial/status')).expect(200);
    expect(response.body).toMatchObject({ status: 'success', externalSendsBlocked: true, paymentCaptureBlocked: true, cornerMexWritesBlocked: true });
  });

  test('preview validates without writes and founder-action auth protects confirmation', async () => {
    const preview = await founder(request(app).post('/api/intelligence/commercial/input-packs/preview')).send({ input: fixture, format: 'json' }).expect(200);
    expect(preview.body.data).toMatchObject({ valid: true, writesPerformed: false });
    await auth(request(app).post('/api/intelligence/commercial/input-packs/confirm')).send({ input: fixture, confirmed: true }).expect(401);
  });

  test('missing migration fails closed after valid founder authentication', async () => {
    const response = await founder(request(app).post('/api/intelligence/commercial/input-packs/confirm')).send({ input: fixture, confirmed: true }).expect(503);
    expect(response.body.code).toBe('COMMERCIAL_PERSISTENCE_REQUIRED');
  });

  test('unexpected origin is denied before any internal write', async () => {
    const response = await auth(request(app).post('/api/intelligence/commercial/opportunities'))
      .set('Origin', 'https://untrusted.example')
      .set('x-cornerops-founder-action-token', founderToken)
      .send({ accountId: 'x' })
      .expect(403);
    expect(response.body).toMatchObject({ code: 'CONTROL_TOWER_FRONTEND_ORIGIN_DENIED', writesBlocked: true });
  });
});
