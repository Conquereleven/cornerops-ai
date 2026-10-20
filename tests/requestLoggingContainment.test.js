const request = require('supertest');
const crypto = require('crypto');
jest.mock('../src/config/env', () => ({ ...jest.requireActual('../src/config/env') }));
const app = require('../src/app');
const env = require('../src/config/env');
const original = { ...env };
let output;
const operatorToken = 'synthetic-monitoring-token';
const enableMonitoring = () => Object.assign(env, {
  controlTowerFrontendApiEnabled: true,
  controlTowerFrontendAuthRequired: true,
  controlTowerFrontendReadOnly: true,
  controlTowerFrontendFailClosed: true,
  controlTowerFrontendMaskPii: true,
  controlTowerFrontendAuditRequests: true,
  controlTowerFrontendTokenHash: crypto.createHash('sha256').update(operatorToken).digest('hex'),
});
const httpLogs = () => output.mock.calls.map(([line]) => JSON.parse(line)).filter(row => row.message === 'http_request');
const expectLog = (method, path, statusCode) => {
  const logs = httpLogs();
  expect(logs).toHaveLength(1);
  expect(logs[0]).toEqual({
    timestamp: expect.any(String), message: 'http_request', method, path, statusCode,
    durationMs: expect.any(Number),
  });
  expect(logs[0].durationMs).toBeGreaterThanOrEqual(0);
};
beforeEach(() => {
  Object.assign(env, original, { internalApiKey: '', allowInternalNoKey: true });
  output = jest.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => { output.mockRestore(); Object.assign(env, original); });

test.each([401, 503])('logs internal denial %i without query, credentials or body', async status => {
  if (status === 401) env.internalApiKey = 'synthetic-configured-key';
  await request(app).post('/api/settings?token=synthetic-query-secret')
    .set('Authorization', 'Bearer synthetic-header-secret')
    .set('x-internal-api-key', 'synthetic-wrong-key')
    .send({ secret: 'synthetic-body-secret' }).expect(status);
  expectLog('POST', '/api/settings', status);
  expect(JSON.stringify(output.mock.calls)).not.toMatch(/synthetic-|token=|Authorization|secret/);
});

test('logs operator denial 403 once with the full mounted pathname', async () => {
  enableMonitoring();
  await request(app).get('/api/intelligence/work-queue/status?token=synthetic-query-secret')
    .set('Authorization', 'Bearer synthetic-wrong-token').expect(403);
  expectLog('GET', '/api/intelligence/work-queue/status', 403);
  expect(JSON.stringify(output.mock.calls)).not.toContain('synthetic-');
});

test('preserves public health and authorized monitoring while logging only safe metadata', async () => {
  enableMonitoring();
  await request(app).get('/api/health').expect(200);
  expectLog('GET', '/api/health', 200);
  output.mockClear();
  await request(app).get('/api/intelligence/work-queue/status?token=synthetic-query-secret')
    .set('Authorization', `Bearer ${operatorToken}`).expect(200);
  expectLog('GET', '/api/intelligence/work-queue/status', 200);
  expect(JSON.stringify(output.mock.calls)).not.toContain('synthetic-');
});
