const request = require('supertest');
const crypto = require('crypto');
jest.mock('../src/services/agent', () => ({ handleMessage: jest.fn(async () => ({ source: 'synthetic' })) }));
jest.mock('../src/controllers/dataController', () => {
  const actual = jest.requireActual('../src/controllers/dataController');
  return Object.fromEntries(Object.entries(actual).map(([name, handler]) => [name,
    ['listProducts', 'receiveGitHubWebhook'].includes(name) ? handler : jest.fn((_req, res) => res.sendStatus(599)),
  ]));
});
jest.mock('../src/controllers/contextController', () => Object.fromEntries(
  Object.keys(jest.requireActual('../src/controllers/contextController')).map(name => [name, jest.fn((_req, res) => res.sendStatus(599))]),
));
jest.mock('../src/config/env', () => ({ ...jest.requireActual('../src/config/env') }));
const app = require('../src/app');
const env = require('../src/config/env');
const original = { ...env };
const inventory = require('../scripts/api-route-inventory');
const { handleMessage } = require('../src/services/agent');
const sign = (body, secret = 'synthetic-provider-secret') => `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

beforeEach(() => {
  Object.assign(env, original, { internalApiKey: '', allowInternalNoKey: true, whatsappWebhookSecret: '', whatsappVerifyToken: '', githubWebhookSecret: '', controlTowerFrontendApiEnabled: false, corneropsWebConsoleEnabled: false, telegramOperatorEnabled: false });
  handleMessage.mockClear();
});
afterAll(() => Object.assign(env, original));

test('every inventoried private route and implicit HEAD/OPTIONS denies anonymous callers before handlers', async () => {
  for (const row of inventory.routes) {
    if (row.category === 'PUBLIC' || (row.method === 'OPTIONS' && /\/intelligence(?:\/|$)|\/frontend\/v1(?:\/|$)/.test(row.path))) continue;
    const url = row.path.replace(/:[^/]+/g, 'synthetic-id');
    const response = await request(app)[row.method.toLowerCase()](url);
    expect({ path: row.path, method: row.method, denied: [401,403,404,405,503].includes(response.status) }).toEqual({ path: row.path, method: row.method, denied: true });
  }
  expect(handleMessage).not.toHaveBeenCalled();
  for (const module of ['../src/controllers/dataController', '../src/controllers/contextController']) {
    for (const handler of Object.values(require(module))) if (jest.isMockFunction(handler)) expect(handler).not.toHaveBeenCalled();
  }
}, 30000);

test('no-key override and NODE_ENV cannot disable internal authentication; configured key still works', async () => {
  env.nodeEnv = 'production';
  await request(app).get('/api/products').expect(503);
  env.nodeEnv = 'test';
  await request(app).get('/api/products').expect(503);
  env.internalApiKey = 'synthetic-service-key';
  await request(app).get('/api/products').expect(401);
  await request(app).get('/api/products').set('x-internal-api-key','wrong').expect(401);
  await request(app).get('/api/products').set('x-internal-api-key','synthetic-service-key').expect(200);
});

test('methods, aliases, case, trailing slashes, query and claimed identities never bypass auth', async () => {
  for (const path of ['/api/settings','/API/settings/','/api/mock/products','/api/context/sources','/api/github/issues','/api/chat','/api/ivr','/api/new-future-route','/api/%73ettings']) {
    for(const method of ['get','head','post','put','patch','delete','options']) {
      await request(app)[method](path+'?api_key=synthetic').set('Host','cornertech.ae').set('Origin','https://cornertech.ae').set('Referer','https://cornertech.ae').set('X-Forwarded-For','127.0.0.1').expect(503);
    }
  }
  expect(handleMessage).not.toHaveBeenCalled();
});

test('public health remains reachable on every hostname', async () => {
  for(const host of ['cornertech.ae','www.cornertech.ae','cornerops-ai-production.up.railway.app']) {
    for(const path of ['/health','/api/health']) await request(app).get(path).set('Host',host).expect(200);
  }
});

test('existing operator token works; auth-disabled configuration and internal keys cannot bypass it', async () => {
  Object.assign(env, {controlTowerFrontendApiEnabled:true,controlTowerFrontendAuthRequired:true,controlTowerFrontendReadOnly:true,controlTowerFrontendFailClosed:true,controlTowerFrontendMaskPii:true,controlTowerFrontendAuditRequests:true,controlTowerFrontendTokenHash:crypto.createHash('sha256').update('synthetic-operator').digest('hex')});
  await request(app).get('/api/intelligence/work-queue/status').expect(401);
  await request(app).get('/api/intelligence/work-queue/status').set('x-internal-api-key','synthetic').expect(401);
  await request(app).get('/api/intelligence/work-queue/status').set('Authorization','Bearer synthetic-operator').expect(200);
  env.controlTowerFrontendAuthRequired=false;
  await request(app).get('/api/intelligence/work-queue/status').expect(503);
});

test.each(['/api/webhooks/whatsapp','/api/github/webhook'])('%s verifies original bytes and rejects all invalid signatures', async (path) => {
  const body = '{ "from": "synthetic", "text": "test" }';
  await request(app).post(path).set('Content-Type','application/json').send(body).expect(503);
  env.whatsappWebhookSecret=env.githubWebhookSecret='synthetic-provider-secret';
  for(const signature of ['', 'sha1=abcd', 'sha256='+'0'.repeat(64), sign(body+' ')]) {
    await request(app).post(path).set('Content-Type','application/json').set('x-hub-signature-256',signature).send(body).expect(401);
  }
  expect(handleMessage).not.toHaveBeenCalled();
});

test('valid raw WhatsApp fixture invokes only the mocked agent', async () => {
  env.whatsappWebhookSecret='synthetic-provider-secret';
  const body='{ "from": "synthetic", "text": "hello" }';
  await request(app).post('/api/webhooks/whatsapp').set('Content-Type','application/json').set('x-hub-signature-256',sign(body)).send(body).expect(200);
  expect(handleMessage).toHaveBeenCalledTimes(1);
});

test('GitHub accepts whitespace-preserving signed fixture without provider calls', async () => {
  env.githubWebhookSecret='synthetic-provider-secret';
  // The existing client stores configuration at construction; use its verifier with a test secret.
  const data = require('../src/core/data');
  const client=data.githubWebhookHandler.client;
  const verify=client.verifyWebhookSignature.bind(client);
  const spy=jest.spyOn(client, 'verifyWebhookSignature').mockImplementation(args => verify({...args, secret:env.githubWebhookSecret}));
  try {
    const body='{ "action": "synthetic" }';
    await request(app).post('/api/github/webhook').set('Content-Type','application/json').set('x-github-delivery','synthetic-delivery').set('x-github-event','ping').set('x-hub-signature-256',sign(body)).send(body).expect(202);
  } finally { spy.mockRestore(); }
});

test('WhatsApp verification requires configured token and valid challenge; HEAD cannot bypass it', async () => {
  await request(app).get('/api/webhooks/whatsapp').expect(503);
  env.whatsappVerifyToken='synthetic-verify';
  await request(app).get('/api/webhooks/whatsapp').expect(403);
  await request(app).get('/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=synthetic-verify&hub.challenge=123').expect(200,'123');
  await request(app).head('/api/webhooks/whatsapp').expect(405);
});

test('console authentication remains mandatory even with require-auth disabled', async () => {
  Object.assign(env, { corneropsWebConsoleEnabled:true,corneropsWebConsoleRequireAuth:false,corneropsWebConsoleAuthToken:'',corneropsWebConsoleLocalOnly:false });
  await request(app).get('/api/control-tower/v0.8/status').expect(503);
  env.corneropsWebConsoleAuthToken='synthetic-console';
  await request(app).get('/api/control-tower/v0.8/status').expect(401);
});

test('encoded API spellings never return the public HTML fallback', async () => {
  for(const path of ['/%61pi/settings','/api%2Fsettings','/%41PI/settings']) {
    await request(app).get(path).set('Accept','text/html').expect(404).expect('Content-Type',/json/);
  }
});
