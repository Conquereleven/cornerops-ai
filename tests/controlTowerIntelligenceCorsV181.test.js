const request = require('supertest');

const LOVABLE_ORIGIN = 'https://id-preview--de6bc54c-b2d7-4527-b464-adf97760ec25.lovable.app';

describe('Control Tower intelligence CORS v1.8.1', () => {
  beforeAll(() => {
    process.env.CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS = LOVABLE_ORIGIN;
    process.env.CONTROL_TOWER_FRONTEND_API_ENABLED = 'true';
    process.env.CONTROL_TOWER_FRONTEND_READ_ONLY = 'true';
    process.env.CONTROL_TOWER_FRONTEND_FAIL_CLOSED = 'true';
    process.env.CONTROL_TOWER_FRONTEND_AUDIT_REQUESTS = 'true';
    process.env.CONTROL_TOWER_FRONTEND_MASK_PII = 'true';
    jest.resetModules();
  });

  test.each([
    '/api/intelligence/control-tower-status',
    '/api/intelligence/action-engine',
  ])('OPTIONS %s uses the exact Lovable allowlist origin', async (path) => {
    const app = require('../src/app');
    const response = await request(app)
      .options(path)
      .set('Origin', LOVABLE_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(LOVABLE_ORIGIN);
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
    expect(response.headers['access-control-allow-headers']).toMatch(/Authorization/i);
  });
});
