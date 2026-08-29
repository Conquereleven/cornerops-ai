const request = require('supertest');
const {
  ApplicationReadinessService,
  SAFE_CODES,
} = require('../src/core/readiness/ApplicationReadinessService');

const createService = ({
  commercialEnabled = false,
  internalPersistenceEnabled = false,
  commercialAvailability = { available: false },
  coreHealth = { healthy: false },
} = {}) => new ApplicationReadinessService({
  config: {
    corneropsCommercialOperationsEnabled: commercialEnabled,
    corneropsInternalPersistenceEnabled: internalPersistenceEnabled,
  },
  commercialOperationsService: { availability: jest.fn().mockResolvedValue(commercialAvailability) },
  corePersistence: { health: jest.fn().mockResolvedValue(coreHealth) },
});

describe('ApplicationReadinessService v1.17B', () => {
  test('reports ready while commercial operations and optional persistence are inactive', async () => {
    const service = createService();
    const result = await service.check();

    expect(result).toEqual({
      httpStatus: 200,
      body: {
        status: 'ready',
        service: 'cornerops-ai',
        mode: 'commercial_inactive',
        corePersistence: { required: false, state: 'not_required' },
        commercialOperations: {
          enabled: false,
          requiredForReadiness: false,
          state: 'disabled',
        },
      },
    });
  });

  test('reports ready when enabled commercial persistence is available', async () => {
    const service = createService({
      commercialEnabled: true,
      internalPersistenceEnabled: true,
      commercialAvailability: { available: true, persistence: { schema: 'must_not_leak' } },
      coreHealth: { healthy: true, connectionString: 'must_not_leak' },
    });
    const result = await service.check();

    expect(result.httpStatus).toBe(200);
    expect(result.body.mode).toBe('commercial_ready');
    expect(JSON.stringify(result)).not.toContain('must_not_leak');
  });

  test('fails closed when enabled commercial persistence is unavailable', async () => {
    const service = createService({ commercialEnabled: true });
    const result = await service.check();

    expect(result.httpStatus).toBe(503);
    expect(result.body).toMatchObject({
      status: 'not_ready',
      mode: 'commercial_persistence_required',
      code: SAFE_CODES.COMMERCIAL_PERSISTENCE_REQUIRED,
    });
  });

  test('fails closed when an indispensable core dependency is unavailable', async () => {
    const service = createService({ internalPersistenceEnabled: true });
    const result = await service.check();

    expect(result.httpStatus).toBe(503);
    expect(result.body).toMatchObject({
      status: 'not_ready',
      mode: 'core_dependency_unavailable',
      code: SAFE_CODES.CORE_PERSISTENCE_REQUIRED,
    });
  });

  test('suppresses thrown persistence details', async () => {
    const service = createService({ commercialEnabled: true });
    service.commercialOperationsService.availability.mockRejectedValue(
      new Error('database credential detail private-host relation missing SQLSTATE 42P01'),
    );
    const result = await service.check();

    expect(result.httpStatus).toBe(503);
    expect(JSON.stringify(result)).not.toMatch(/operator|secret|private-host|42P01|relation/i);
  });
});

describe('GET /api/ready', () => {
  beforeEach(() => {
    delete process.env.CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED;
    delete process.env.CORNEROPS_INTERNAL_PERSISTENCE_ENABLED;
    delete process.env.CORNEROPS_INTERNAL_DATABASE_URL;
    jest.resetModules();
  });

  test('exposes a distinct readiness endpoint without changing liveness', async () => {
    const app = require('../src/app');
    const [readiness, liveness] = await Promise.all([
      request(app).get('/api/ready'),
      request(app).get('/api/health'),
    ]);

    expect(readiness.status).toBe(200);
    expect(readiness.body).toMatchObject({ status: 'ready', mode: 'commercial_inactive' });
    expect(liveness.status).toBe(200);
    expect(liveness.body.status).toBe('ok');
  });

  test('returns sanitized 503 when commercial operations are enabled without persistence', async () => {
    process.env.CORNEROPS_COMMERCIAL_OPERATIONS_ENABLED = 'true';
    const app = require('../src/app');
    const response = await request(app).get('/api/ready');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'not_ready',
      code: SAFE_CODES.COMMERCIAL_PERSISTENCE_REQUIRED,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/sql|schema|host|credential|stack|42P01/i);
  });
});
