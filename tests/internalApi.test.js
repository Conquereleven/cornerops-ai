process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Internal operations API', () => {
  test('allows the safe test bypass and lists internal resources', async () => {
    const [conversations, leads, products, orders] = await Promise.all([
      request(app).get('/api/internal/conversations'),
      request(app).get('/api/internal/leads'),
      request(app).get('/api/internal/products'),
      request(app).get('/api/internal/orders'),
    ]);

    expect(conversations.statusCode).toBe(200);
    expect(leads.statusCode).toBe(200);
    expect(products.body.length).toBeGreaterThanOrEqual(7);
    expect(orders.body.length).toBeGreaterThan(0);
  });

  test('creates a lead and updates its status', async () => {
    const created = await request(app).post('/api/internal/leads').send({
      userId: `internal-lead-${Date.now()}`,
      businessName: 'Internal QA Market',
      businessType: 'supermarket',
      city: 'Dubai',
      email: 'buyer@internal.example',
      productsOfInterest: ['Tajín'],
      estimatedVolume: '40 boxes per month',
      status: 'new',
    });
    const updated = await request(app)
      .patch(`/api/internal/leads/${created.body.id}/status`)
      .send({ status: 'contacted' });

    expect(created.statusCode).toBe(201);
    expect(updated.body.status).toBe('contacted');
  });
});
