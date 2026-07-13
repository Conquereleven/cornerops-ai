const request = require('supertest');
const crypto = require('crypto');

const operatorToken = 'supplygraph-read-token';
const founderToken = 'supplygraph-founder-token';
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
process.env.SUPPLYGRAPH_ENABLED = 'true';
process.env.SUPPLYGRAPH_INTERMEX_SYNC_ENABLED = 'true';
process.env.SUPPLYGRAPH_DEMAND_INTAKE_ENABLED = 'true';

const controller = require('../src/controllers/intelligenceController');
const app = require('../src/app');
const operator = (call) => call.set('Authorization', `Bearer ${operatorToken}`);
const founder = (call) => operator(call).set('x-cornerops-founder-action-token', founderToken);

describe('SupplyGraph API v1.10', () => {
  beforeEach(() => {
    jest.spyOn(controller.supplyGraphService, 'status').mockResolvedValue({
      status: 'ready', persistence: { provider: 'postgres', durable: true, schema: 'cornerops_internal' },
      cornerMexWritesBlocked: true, externalActionsBlocked: true, matchingEngineStatus: 'not_implemented',
    });
    jest.spyOn(controller.supplyGraphService, 'listSuppliers').mockResolvedValue([{ id: 'supplier-1', canonicalName: 'Intermex UAE' }]);
    jest.spyOn(controller.supplyGraphService, 'listCatalog').mockResolvedValue([]);
    jest.spyOn(controller.supplyGraphService, 'listDemands').mockResolvedValue([]);
    jest.spyOn(controller.supplyGraphService, 'syncIntermex').mockResolvedValue({ scannedItems: 190, externalActions: false, cornerMexMutations: false });
    jest.spyOn(controller.supplyGraphService, 'createDemand').mockResolvedValue({ created: true, request: { id: 'demand-1', status: 'needs_information' }, items: [] });
    jest.spyOn(controller.supplyGraphService, 'updateDemand').mockResolvedValue({ request: { id: 'demand-1', version: 2 }, items: [] });
  });
  afterEach(() => jest.restoreAllMocks());

  test('GET routes require only the valid operator token', async () => {
    await request(app).get('/api/intelligence/supplygraph/status').expect(401);
    await request(app).get('/api/intelligence/supplygraph/status').set('Authorization', 'Bearer wrong').expect(403);
    const response = await operator(request(app).get('/api/intelligence/supplygraph/status')).expect(200);
    expect(response.body.persistence).toMatchObject({ provider: 'postgres', durable: true });
    await operator(request(app).get('/api/intelligence/supplygraph/suppliers')).expect(200);
    await operator(request(app).get('/api/intelligence/supplygraph/catalog')).expect(200);
    await operator(request(app).get('/api/intelligence/supplygraph/demand-requests')).expect(200);
  });

  test('mutations require operator and separate founder-action credentials', async () => {
    await operator(request(app).post('/api/intelligence/supplygraph/intermex/sync')).send({}).expect(401);
    await request(app).post('/api/intelligence/supplygraph/intermex/sync')
      .set('x-cornerops-founder-action-token', founderToken).send({}).expect(401);
    await operator(request(app).post('/api/intelligence/supplygraph/intermex/sync'))
      .set('x-cornerops-founder-action-token', 'wrong').send({}).expect(403);
    const response = await founder(request(app).post('/api/intelligence/supplygraph/intermex/sync'))
      .send({}).expect(202);
    expect(response.body).toMatchObject({ externalActions: false, cornerMexMutations: false });
  });

  test('write routes reject non-JSON and disallowed origins', async () => {
    await founder(request(app).post('/api/intelligence/supplygraph/demand-requests'))
      .set('Content-Type', 'text/plain').send('not-json').expect(415);
    await founder(request(app).post('/api/intelligence/supplygraph/demand-requests'))
      .set('Origin', 'https://attacker.example').send({}).expect(403);
  });

  test('demand POST and PATCH expose no execution path or secrets', async () => {
    const created = await founder(request(app).post('/api/intelligence/supplygraph/demand-requests'))
      .send({ customerSegment: 'restaurant', emirate: 'Dubai', sourceType: 'operator', items: [{ itemKey: 'x', productQuery: 'Tajin' }] })
      .expect(201);
    expect(created.body).toMatchObject({ matchingEngineStatus: 'not_implemented', externalActionsBlocked: true });
    const updated = await founder(request(app).patch('/api/intelligence/supplygraph/demand-requests/demand-1'))
      .send({ command: 'set_priority', version: 1, priority: 'high' }).expect(200);
    expect(updated.body.externalActionsBlocked).toBe(true);
    expect(JSON.stringify(updated.body)).not.toContain(founderToken);
  });
});
