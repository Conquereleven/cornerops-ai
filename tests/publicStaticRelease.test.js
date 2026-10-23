const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
jest.mock('../src/config/env', () => ({ ...jest.requireActual('../src/config/env'), corneropsFrontendServeEnabled: true, internalApiKey: '', allowInternalNoKey: false }));
let app;
let dist;
beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ct-public-serving-'));
  for (const [file, title] of [['index.html','Home'], ['products/commerce/index.html','Commerce'], ['solutions/index.html','Solutions'], ['404.html','Page unavailable']]) {
    fs.mkdirSync(path.dirname(path.join(dist,file)),{recursive:true});
    fs.writeFileSync(path.join(dist,file),`<!doctype html><title>${title}</title><main>${title}</main>`);
  }
  fs.mkdirSync(path.join(dist,'assets'));fs.writeFileSync(path.join(dist,'assets/current.js'),'/* synthetic public asset */');
  fs.writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nAllow: /\n');
  jest.doMock('path', () => ({ ...jest.requireActual('path'),
    resolve: (...parts) => parts[1] === '../frontend/dist' ? dist : path.resolve(...parts),
  }));
  app = require('../src/app');
});
afterAll(() => fs.rmSync(dist,{recursive:true,force:true}));

test.each([['/','Home'],['/products/commerce','Commerce'],['/products/commerce/','Commerce'],['/solutions','Solutions']])('GET and HEAD %s return their own HTML with no-store', async (url,title) => {
  const res=await request(app).get(url).set('Host','cornertech.ae').set('Accept','text/html').expect(200);
  expect(res.text).toContain(`<title>${title}</title>`);
  expect(res.headers['cache-control']).toContain('no-store');
  expect(res.headers['x-robots-tag']).toBeUndefined();
  await request(app).head(url).expect(200);
});

test.each(['/unknown','/login','/app/sales','/constructor','/index.html','/404.html','/products/commerce/index.html','/index%2ehtml'])('unknown/private/direct HTML %s is a real noindex 404', async url => {
  const res=await request(app).get(url).set('Accept','text/html').expect(404);
  expect(res.text).toContain('Page unavailable');
  expect(res.text).not.toContain('<title>Home</title>');
  expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
  await request(app).head(url).expect(404);
});

test('health/assets and authenticated API containment remain independent of HTML', async () => {
  await request(app).get('/api/health').expect(200).expect('Content-Type',/json/);
  await request(app).get('/health').expect(200).expect('Content-Type',/json/);
  await request(app).get('/assets/current.js').expect(200);
  await request(app).get('/robots.txt').expect(200);
  await request(app).get('/api/agents').expect(503).expect('Content-Type',/json/);
  await request(app).get('/ap%69/agents').expect(404).expect('Content-Type',/json/);
  await request(app).get('/unknown').set('Accept','application/json').expect(404).expect('Content-Type',/json/);
});

test('an incomplete build fails closed instead of serving Home as Commerce', async () => {
  fs.unlinkSync(path.join(dist,'products/commerce/index.html'));
  const res=await request(app).get('/products/commerce').expect(503);
  expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
});

test('non-public preview hosts remain noindex without affecting production domains', async () => {
  for (const host of ['cornertech.ae', 'www.cornertech.ae', 'preview.up.railway.app']) {
    const res = await request(app).get('/').set('Host',host).expect(200);
    expect(res.headers['x-robots-tag']).toBe(host.endsWith('cornertech.ae') ? undefined : 'noindex, nofollow');
  }
});
