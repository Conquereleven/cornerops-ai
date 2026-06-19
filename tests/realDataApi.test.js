const request = require('supertest');
const app = require('../src/app');

describe('real data control tower API', () => {
  test('exposes read-only/mock data endpoints', async () => {
    await request(app)
      .get('/api/quotes/follow-up')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThan(0);
      });

    await request(app)
      .get('/api/orders/manual-payments')
      .expect(200)
      .expect((res) => {
        expect(res.body.some((order) => order.paymentMethod === 'bank_transfer')).toBe(true);
      });

    await request(app)
      .get('/api/github/issues')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThan(0);
      });

    await request(app)
      .get('/api/data-health')
      .expect(200)
      .expect((res) => {
        expect(res.body.mode).toBe('mock');
      });

    await request(app)
      .get('/api/openclaw-ecosystem/services')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(7);
      });
  });

  test('write-style endpoints remain dry-run/proposal only', async () => {
    await request(app)
      .post('/api/github/issues')
      .send({ title: 'Bug dry-run', body: 'No real issue' })
      .expect(403)
      .expect((res) => {
        expect(res.body.status).toBe('denied');
        expect(res.body.message).toMatch(/GITHUB_READ_ONLY=true/);
      });

    await request(app)
      .post('/api/orders/order-bank-transfer-001/manual-payment-mark-paid-request')
      .send({})
      .expect(202)
      .expect((res) => {
        expect(res.body.requiresApproval).toBe(true);
      });
  });
});
