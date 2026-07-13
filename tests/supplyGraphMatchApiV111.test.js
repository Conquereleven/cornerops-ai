const request = require('supertest');
const crypto = require('crypto');

const operatorToken = 'match-api-operator';
const founderToken = 'match-api-founder';
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
process.env.SUPPLYGRAPH_MATCHING_ENABLED = 'true';

const controller = require('../src/controllers/intelligenceController');
const app = require('../src/app');
const operator = (call) => call.set('Authorization', `Bearer ${operatorToken}`);
const founder = (call) => operator(call).set('x-cornerops-founder-action-token', founderToken);

describe('SupplyGraph Match API v1.11', () => {
  beforeEach(() => {
    jest.spyOn(controller.supplyGraphService, 'matchDemand').mockResolvedValue({
      reused: false,
      matchRun: { id: 'run-1', inputFingerprint: 'a'.repeat(64), comparisonScope: 'single_verified_supplier', supplierCountEvaluated: 1, marketComparisonPerformed: false, bestSupplierClaim: false },
      items: [], recommendation: { executed: false, externalActionAllowed: false },
      cornerMexMutations: false, productActivationBlocked: true, externalActionsBlocked: true,
    });
    jest.spyOn(controller.supplyGraphService, 'listMatchRuns').mockResolvedValue([{ id: 'run-1' }]);
    jest.spyOn(controller.supplyGraphService, 'getMatchRun').mockResolvedValue({ matchRun: { id: 'run-1' }, items: [], recommendation: {} });
    jest.spyOn(controller.supplyGraphService, 'listDemandMatchRuns').mockResolvedValue([{ id: 'run-1' }]);
    jest.spyOn(controller.supplyGraphService, 'latestDemandMatch').mockResolvedValue({ matchRun: { id: 'run-1' }, items: [], recommendation: {} });
  });
  afterEach(() => jest.restoreAllMocks());

  test('match POST requires operator and separate founder credentials', async () => {
    const path = '/api/intelligence/supplygraph/demand-requests/demand-1/match';
    await request(app).post(path).send({ version: 1 }).expect(401);
    await operator(request(app).post(path)).send({ version: 1 }).expect(401);
    await operator(request(app).post(path)).set('x-cornerops-founder-action-token', 'wrong').send({ version: 1 }).expect(403);
    const response = await founder(request(app).post(path)).send({ version: 1, maxCandidatesPerItem: 5 }).expect(201);
    expect(response.body).toMatchObject({ cornerMexMutations: false, externalActionsBlocked: true, matchRun: { marketComparisonPerformed: false, bestSupplierClaim: false } });
  });

  test('match reads require only operator auth and expose all history routes', async () => {
    await request(app).get('/api/intelligence/supplygraph/match-runs').expect(401);
    await operator(request(app).get('/api/intelligence/supplygraph/match-runs')).expect(200);
    await operator(request(app).get('/api/intelligence/supplygraph/match-runs/run-1')).expect(200);
    await operator(request(app).get('/api/intelligence/supplygraph/demand-requests/demand-1/match-runs')).expect(200);
    await operator(request(app).get('/api/intelligence/supplygraph/demand-requests/demand-1/latest-match')).expect(200);
  });

  test('match POST rejects non-JSON and disallowed origin before execution', async () => {
    const path = '/api/intelligence/supplygraph/demand-requests/demand-1/match';
    await founder(request(app).post(path)).set('Content-Type', 'text/plain').send('bad').expect(415);
    await founder(request(app).post(path)).set('Origin', 'https://attacker.example').send({ version: 1 }).expect(403);
    expect(controller.supplyGraphService.matchDemand).not.toHaveBeenCalled();
  });

  test('responses never expose auth credentials', async () => {
    const response = await founder(request(app).post('/api/intelligence/supplygraph/demand-requests/demand-1/match')).send({ version: 1 }).expect(201);
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain(operatorToken);
    expect(serialized).not.toContain(founderToken);
  });
});
