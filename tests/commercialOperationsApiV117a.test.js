const crypto = require('crypto');
const request = require('supertest');
const fixture = require('./fixtures/commercial/commercial-input-v117a.json');

const operatorToken = 'test-operator-token-v117a';
const founderToken = 'test-founder-action-token-v117a';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const dataRoutes = [
  'founder-daily', 'accounts', 'skus', 'opportunities', 'quotes', 'orders',
  'payments', 'fulfillments', 'exceptions', 'daily-closes',
];
const allReadRoutes = ['status', ...dataRoutes];

const configureApi = (enabled) => {
  process.env.CONTROL_TOWER_FRONTEND_TOKEN_HASH = hash(operatorToken);
  process.env.CONTROL_TOWER_FRONTEND_API_ENABLED = 'true';
  process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH = hash(founderToken);
  process.env.CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS = 'http://127.0.0.1:5173';
  process.env.CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED = String(enabled);
  process.env.CORNEROPS_INTERNAL_PERSISTENCE_ENABLED = 'false';
  jest.resetModules();
  return require('../src/app');
};

const clearApiConfig = () => {
  delete process.env.CONTROL_TOWER_FRONTEND_TOKEN_HASH;
  delete process.env.CONTROL_TOWER_FRONTEND_API_ENABLED;
  delete process.env.CONTROL_TOWER_FOUNDER_ACTION_TOKEN_HASH;
  delete process.env.CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS;
  delete process.env.CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED;
  delete process.env.CORNEROPS_INTERNAL_PERSISTENCE_ENABLED;
  jest.resetModules();
};

const auth = (call) => call.set('Authorization', `Bearer ${operatorToken}`);
const founder = (call) => auth(call)
  .set('Origin', 'http://127.0.0.1:5173')
  .set('x-cornerops-founder-action-token', founderToken)
  .set('x-operator-id', 'founder-test')
  .set('Content-Type', 'application/json');

describe('CO-1.17A-R1 disabled commercial API boundary', () => {
  let app;
  beforeAll(() => { app = configureApi(false); });
  afterAll(clearApiConfig);

  test.each(allReadRoutes)('authentication precedes disabled disclosure for GET %s', async (route) => {
    const response = await request(app).get(`/api/intelligence/commercial/${route}`).expect(401);
    expect(JSON.stringify(response.body)).not.toMatch(/FEATURE_DISABLED|COMMERCIAL_OPERATIONS_DISABLED/);
  });

  test('authenticated status is truthful and disabled without persistence disclosure', async () => {
    const response = await auth(request(app).get('/api/intelligence/commercial/status')).expect(200);
    expect(response.body).toMatchObject({
      status: 'disabled',
      code: 'COMMERCIAL_OPERATIONS_DISABLED',
      featureEnabled: false,
      available: false,
      querySkipped: true,
      readOnly: true,
      writesBlocked: true,
      cornerMexWritesBlocked: true,
      externalSendsBlocked: true,
      paymentCaptureBlocked: true,
      reason: 'FEATURE_DISABLED',
    });
  });

  test.each(dataRoutes)('authenticated disabled GET %s returns unavailable, never empty data', async (route) => {
    const response = await auth(request(app).get(`/api/intelligence/commercial/${route}`)).expect(503);
    expect(response.body).toMatchObject({
      status: 'unavailable',
      code: 'COMMERCIAL_OPERATIONS_DISABLED',
      featureEnabled: false,
      querySkipped: true,
      writesBlocked: true,
    });
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toMatch(/42P01|commercial_entities|cornerops_internal|select\s|insert\s/i);
    expect(response.body.data?.items).toBeUndefined();
  });

  test('input preview remains no-write while confirmation stays disabled', async () => {
    const preview = await founder(request(app).post('/api/intelligence/commercial/input-packs/preview'))
      .send({ input: fixture, format: 'json' }).expect(200);
    expect(preview.body.data).toMatchObject({ valid: true, writesPerformed: false });
    const confirmation = await founder(request(app).post('/api/intelligence/commercial/input-packs/confirm'))
      .send({ input: fixture, confirmed: true }).expect(503);
    expect(confirmation.body.code).toBe('COMMERCIAL_OPERATIONS_DISABLED');
  });
});

describe('CO-1.17A-R1 enabled with unavailable persistence', () => {
  let app;
  beforeAll(() => { app = configureApi(true); });
  afterAll(clearApiConfig);

  test('status reports configuration_required without querying commercial data', async () => {
    const response = await auth(request(app).get('/api/intelligence/commercial/status')).expect(200);
    expect(response.body).toMatchObject({
      status: 'configuration_required',
      code: 'COMMERCIAL_PERSISTENCE_REQUIRED',
      featureEnabled: true,
      available: false,
      querySkipped: true,
      writesBlocked: true,
    });
  });

  test.each(dataRoutes)('GET %s requires persistence and exposes no database detail', async (route) => {
    const response = await auth(request(app).get(`/api/intelligence/commercial/${route}`)).expect(503);
    expect(response.body).toMatchObject({
      status: 'unavailable',
      code: 'COMMERCIAL_PERSISTENCE_REQUIRED',
      featureEnabled: true,
      querySkipped: true,
      writesBlocked: true,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/42P01|commercial_entities|cornerops_internal|select\s|insert\s/i);
  });

  test('preview validates without writes and founder-action auth protects confirmation', async () => {
    const preview = await founder(request(app).post('/api/intelligence/commercial/input-packs/preview'))
      .send({ input: fixture, format: 'json' }).expect(200);
    expect(preview.body.data).toMatchObject({ valid: true, writesPerformed: false });
    await auth(request(app).post('/api/intelligence/commercial/input-packs/confirm'))
      .send({ input: fixture, confirmed: true }).expect(401);
  });

  test('missing migration fails closed after valid founder authentication', async () => {
    const response = await founder(request(app).post('/api/intelligence/commercial/input-packs/confirm'))
      .send({ input: fixture, confirmed: true }).expect(503);
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
