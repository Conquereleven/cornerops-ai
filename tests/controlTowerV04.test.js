process.env.TELEGRAM_OPERATOR_ENABLED = 'false';
process.env.CORNEROPS_TELEGRAM_REAL_MODE = 'false';
process.env.CORNEROPS_TELEGRAM_ALLOW_POLLING = 'false';
process.env.CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY = 'false';

const request = require('supertest');
const app = require('../src/app');
const { controlTowerService } = require('../src/core/control-tower');
const { ControlTowerService } = require('../src/core/control-tower/ControlTowerService');

describe('Control Tower v0.4', () => {
  test('produces a healthy mock beta report with write and send blocking', async () => {
    const report = await controlTowerService.getBetaReport();
    expect(report.status).toBe('healthy');
    expect(report.businessData).toMatchObject({ mode: 'mock', readOnlyVerified: true });
    expect(report.dataContracts.map((item) => item.entity)).toEqual(['lead', 'quote', 'order', 'audit_log', 'approval']);
    expect(report.security).toMatchObject({ writesBlocked: true, externalSendsBlocked: true });
    expect(report.disabledExternalSources.map((item) => item.id)).toEqual(expect.arrayContaining(['slack', 'whatsapp', 'telegram', 'notion', 'native_tools']));
  });

  test('exposes beta, contracts and schema endpoints', async () => {
    await request(app).get('/api/control-tower/beta').expect(200)
      .expect((res) => expect(res.body.businessData.readOnlyVerified).toBe(true));
    await request(app).get('/api/control-tower/data-contracts').expect(200)
      .expect((res) => expect(res.body).toHaveLength(5));
    await request(app).get('/api/control-tower/schema-discovery').expect(200)
      .expect((res) => expect(res.body.tables).toHaveLength(5));
  });

  test('reports degraded when real DB is requested without credentials', async () => {
    const service = new ControlTowerService({
      ...controlTowerService,
      config: { ...controlTowerService.config, corneropsBusinessDataEnabled: true },
    });
    const report = await service.getBetaReport();
    expect(report.status).toBe('degraded');
  });
});
