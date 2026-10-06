const fs = require('fs');
const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };
const INTERNAL_KEY = 'inventory-test-internal-key';
const samplePath = (path) => path.replace(/:[A-Za-z]+/g, 'sample');
const call = (app, route) => request(app)[route.method.toLowerCase()](samplePath(route.path)).set('Content-Type', 'application/json');

// Loaded as production so no test-only shortcut (internalAuth) hides an open route.
describe('API route inventory and anonymous access', () => {
  jest.setTimeout(60000);
  let app; let inventory; let CLASSES;

  beforeAll(() => {
    for (const level of ['log', 'info', 'warn', 'error']) jest.spyOn(console, level).mockImplementation(() => {});
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV, NODE_ENV: 'production', INTERNAL_API_KEY: INTERNAL_KEY, ALLOW_INTERNAL_NO_KEY: 'false',
      CORNEROPS_FRONTEND_SERVE_ENABLED: 'false', CORNEROPS_API_ENABLED: 'true',
    };
    app = require('../src/app');
    ({ CLASSES } = require('../src/api/routeInventory'));
    inventory = require('../src/api/routeInventory').buildInventory(app);
  });
  afterAll(() => { jest.restoreAllMocks(); process.env = { ...ORIGINAL_ENV }; jest.resetModules(); });

  test('every mounted route has exactly one class', () => {
    expect(inventory.length).toBeGreaterThan(200);
    expect(inventory.filter((route) => !route.class).map((route) => `${route.method} ${route.path}`)).toEqual([]);
  });

  test('only health is public', () => {
    expect(inventory.filter((route) => route.class === CLASSES.PUBLIC).map((route) => route.path).sort())
      .toEqual(['/api/health', '/health']);
  });

  test('the published inventory matches the code', () => {
    const { render, target } = require('../scripts/generate-route-inventory');
    expect(render()).toBe(fs.readFileSync(target, 'utf8'));
  });

  test('public health works anonymously', async () => {
    await request(app).get('/health').expect(200);
    await request(app).get('/api/health').expect(200);
  });

  test('no workspace or founder route is reachable anonymously', async () => {
    const open = [];
    for (const route of inventory.filter((item) => [CLASSES.WORKSPACE, CLASSES.FOUNDER].includes(item.class))) {
      const response = await call(app, route);
      const bridge = route.path.startsWith('/api/intelligence') || route.path.startsWith('/api/control-tower/frontend/v1');
      const allowed = bridge ? [401, 403, 503] : [401];
      if (!allowed.includes(response.statusCode)) open.push(`${route.method} ${route.path} -> ${response.statusCode}`);
    }
    expect(open).toEqual([]);
  });

  test('a forged session token is rejected on every workspace route', async () => {
    const open = [];
    for (const route of inventory.filter((item) => item.class === CLASSES.WORKSPACE)) {
      const response = await call(app, route).set('Authorization', 'Bearer forged.session.token');
      if (![401, 503].includes(response.statusCode)) open.push(`${route.method} ${route.path} -> ${response.statusCode}`);
    }
    expect(open).toEqual([]);
  });

  test('internal routes require the internal key and ignore user sessions', async () => {
    const open = [];
    for (const route of inventory.filter((item) => item.class === CLASSES.INTERNAL)) {
      const anonymous = await call(app, route);
      const session = await call(app, route).set('Authorization', 'Bearer forged.session.token');
      const wrongKey = await call(app, route).set('x-internal-api-key', 'wrong');
      for (const response of [anonymous, session, wrongKey]) {
        if (![401, 404].includes(response.statusCode)) open.push(`${route.method} ${route.path} -> ${response.statusCode}`);
      }
    }
    expect(open).toEqual([]);
  });

  test('an internal route accepts the internal key', async () => {
    const response = await request(app).get('/api/control-tower/status').set('x-internal-api-key', INTERNAL_KEY);
    expect(response.statusCode).not.toBe(401);
  });

  test('webhooks reject unsigned callbacks and are not unlocked by sessions or the internal key', async () => {
    const open = [];
    for (const route of inventory.filter((item) => item.class === CLASSES.WEBHOOK && item.method === 'POST')) {
      const attempts = [
        call(app, route).send('{}'),
        call(app, route).set('x-internal-api-key', INTERNAL_KEY).send('{}'),
        call(app, route).set('x-hub-signature-256', `sha256=${'0'.repeat(64)}`).set('x-telegram-bot-api-secret-token', 'wrong').send('{}'),
      ];
      for (const response of await Promise.all(attempts)) {
        if (![401, 403, 404, 503].includes(response.statusCode)) open.push(`${route.method} ${route.path} -> ${response.statusCode}`);
      }
    }
    expect(open).toEqual([]);
  });
});
