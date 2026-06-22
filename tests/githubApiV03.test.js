const request = require('supertest');
const app = require('../src/app');

describe('GitHub v0.3 read-only API', () => {
  test('exposes fixture-backed read endpoints while real onboarding is disabled', async () => {
    const issues = await request(app).get('/api/github/issues').expect(200);
    await request(app).get(`/api/github/issues/${issues.body[0].number}`).expect(200);

    const prs = await request(app).get('/api/github/pull-requests').expect(200);
    await request(app).get(`/api/github/pull-requests/${prs.body[0].number}`).expect(200);

    const runs = await request(app).get('/api/github/workflow-runs').expect(200);
    await request(app).get(`/api/github/workflow-runs/${runs.body[0].id}`).expect(200);

    await request(app).get('/api/github/repository').expect(200)
      .expect((res) => expect(res.body.source).toBe('mock'));
  });

  test('blocks issue creation by default', async () => {
    await request(app)
      .post('/api/github/issues')
      .send({ title: 'Must remain a draft' })
      .expect(403)
      .expect((res) => expect(res.body.status).toBe('denied'));
  });
});
