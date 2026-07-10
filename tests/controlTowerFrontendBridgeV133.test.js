const express = require('express');
const request = require('supertest');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');
const { createControlTowerFrontendAuth, sha256 } = require('../src/api/middleware/controlTowerFrontendAuth');
const { createControlTowerFrontendCors } = require('../src/api/middleware/controlTowerFrontendCors');
const { createControlTowerFrontendRateLimit } = require('../src/api/middleware/controlTowerFrontendRateLimit');
const { createControlTowerFrontendSanitizer } = require('../src/api/middleware/controlTowerFrontendSanitizer');
const {
  CONTROL_TOWER_FRONTEND_VERSION,
  assertNoSecretKeys,
} = require('../src/api/contracts/controlTowerFrontendSchemas');

const baseConfig = () => ({
  controlTowerFrontendApiEnabled: true,
  controlTowerFrontendAuthRequired: true,
  controlTowerFrontendAuthMode: 'operator_token',
  controlTowerFrontendTokenHash: `sha256:${sha256('valid-operator-token')}`,
  controlTowerFrontendAllowedOrigins: ['https://preview.lovable.app', 'https://lovable.dev'],
  controlTowerFrontendAllowLocalhost: true,
  controlTowerFrontendReadOnly: true,
  controlTowerFrontendFailClosed: true,
  controlTowerFrontendMaxPayloadKb: 256,
  controlTowerFrontendRequestTimeoutMs: 8000,
  controlTowerFrontendRateLimitPerMinute: 60,
  controlTowerFrontendAuditRequests: true,
  controlTowerFrontendMaskPii: true,
});

const createContract = () => new ControlTowerFrontendContract({
  approvalCenterService: { list: async () => ({ approvals: [], pendingCount: 0 }) },
  auditViewerService: {
    getEvents: async () => ({
      events: [{
        id: 'audit-bridge-test',
        email: 'founder@example.com',
        secretValue: 'should-be-boolean',
      }],
    }),
  },
  controlTowerReportService: {
    getReport: async () => ({
      generatedAt: '2026-07-03T00:00:00.000Z',
      safety: { externalSendsBlocked: true, warnings: [] },
      realSourceExpansion: { sourceModeSummary: 'repo_discovered' },
      cornerMexLovableConnector: { sourceMode: 'repo_discovered', writesBlocked: true, warnings: [] },
      cornerMexFlowEngine: { enabled: true, sourceMode: 'repo_discovered', availableFlows: [] },
      telegramOperator: { operatorMode: 'polling', founderPollingStatus: 'active_local_founder_only' },
    }),
  },
  controlledActionExecutor: {
    status: () => ({ enabled: true, dryRun: true, realExecutionAllowed: false, actions: [] }),
  },
});

const createApp = (overrides = {}, store = new Map()) => {
  const config = { ...baseConfig(), ...overrides };
  const contract = createContract();
  const app = express();
  app.use(
    '/api/control-tower/frontend/v1',
    createControlTowerFrontendCors(config),
    createControlTowerFrontendAuth(config),
    createControlTowerFrontendRateLimit(config, store),
    createControlTowerFrontendSanitizer(config),
  );
  app.get('/api/control-tower/frontend/v1/connection-test', async (req, res) => {
    res.json(await contract.getConnectionTest({
      auditId: req.controlTowerFrontendAuth?.auditId,
      authMode: req.controlTowerFrontendAuth?.authMode,
      origin: req.get('origin') || '',
    }));
  });
  app.get('/api/control-tower/frontend/v1/audit', async (_req, res) => {
    res.json(await contract.getSection('audit'));
  });
  app.get('/api/control-tower/frontend/v1', async (_req, res) => {
    res.json(await contract.getAllSections());
  });
  return app;
};

describe('Control Tower backend bridge v1.3.3', () => {
  test('disabled API fails closed', async () => {
    const res = await request(createApp({ controlTowerFrontendApiEnabled: false }))
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app');
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('CONTROL_TOWER_FRONTEND_API_DISABLED');
    expect(res.body.writesBlocked).toBe(true);
  });

  test('missing token returns 401 and invalid token returns 403 without echoing tokens', async () => {
    const app = createApp();
    const missing = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app');
    const invalid = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app')
      .set('Authorization', 'Bearer invalid-secret-token');
    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(403);
    expect(JSON.stringify(invalid.body)).not.toContain('invalid-secret-token');
  });

  test('valid token returns safe connection-test metadata', async () => {
    const res = await request(createApp())
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app')
      .set('Authorization', 'Bearer valid-operator-token');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'success',
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
    });
    expect(res.body.auditId).toBeTruthy();
    expect(res.body.data.apiVersion).toBe(CONTROL_TOWER_FRONTEND_VERSION);
    expect(res.body.data.authMode).toBe('operator_token');
    expect(assertNoSecretKeys(res.body)).toBe(true);
  });

  test('CORS allowlist accepts configured origins, localhost and rejects disallowed origins', async () => {
    const app = createApp();
    const allowed = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app')
      .set('Authorization', 'Bearer valid-operator-token');
    const localhost = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', 'Bearer valid-operator-token');
    const denied = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://evil.example')
      .set('Authorization', 'Bearer valid-operator-token');
    expect(allowed.status).toBe(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('https://preview.lovable.app');
    expect(localhost.status).toBe(200);
    expect(denied.status).toBe(403);
  });

  test('OPTIONS preflight works without wildcard origin', async () => {
    const res = await request(createApp())
      .options('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://preview.lovable.app');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  test('rate limit blocks excessive requests', async () => {
    const app = createApp({ controlTowerFrontendRateLimitPerMinute: 1 }, new Map());
    const first = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app')
      .set('Authorization', 'Bearer valid-operator-token');
    const second = await request(app)
      .get('/api/control-tower/frontend/v1/connection-test')
      .set('Origin', 'https://preview.lovable.app')
      .set('Authorization', 'Bearer valid-operator-token');
    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });

  test('sanitizer masks PII and blocks secret-like payload values', async () => {
    const audit = await request(createApp())
      .get('/api/control-tower/frontend/v1/audit')
      .set('Origin', 'https://preview.lovable.app')
      .set('Authorization', 'Bearer valid-operator-token');
    expect(audit.status).toBe(200);
    expect(JSON.stringify(audit.body)).not.toContain('founder@example.com');
    expect(audit.body.data.events[0].email).toMatch(/\*\*\*/);
    expect(audit.body.data.events[0].secretValue).toBe(true);
    expect(assertNoSecretKeys(audit.body)).toBe(true);
  });
});
