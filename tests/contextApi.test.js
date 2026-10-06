process.env.CORNEROPS_CONTEXT_LAYER_ENABLED = 'true';
process.env.GITHUB_CONTEXT_ENABLED = 'true';
process.env.SLACK_CONTEXT_ENABLED = 'true';
process.env.WHATSAPP_CONTEXT_ENABLED = 'true';
process.env.NOTION_CONTEXT_ENABLED = 'true';

const request = require('supertest');
const { authed, installTestAppAuth } = require('./helpers/appAuth');

installTestAppAuth();
const app = require('../src/app');

describe('context API', () => {
  test('serves context search, sources, health and archive records', async () => {
    await authed(app)
      .get('/api/context/search?q=Tajin%20Pulparindo')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThan(0);
      });
    await authed(app).get('/api/context/sources').expect(200);
    await authed(app).get('/api/context/health').expect(200);
    await authed(app).get('/api/local-archives/records').expect(200);
  });

  test('proposal endpoints remain dry-run/approval-required', async () => {
    await authed(app)
      .post('/api/context/sources/whatsapp_archive/enable-request')
      .send({})
      .expect(202)
      .expect((res) => {
        expect(res.body.requiresApproval).toBe(true);
      });
    await authed(app)
      .post('/api/native-tools/wacli/enable-request')
      .send({})
      .expect(202)
      .expect((res) => {
        expect(res.body.status).toBe('dry_run');
      });
  });
});
