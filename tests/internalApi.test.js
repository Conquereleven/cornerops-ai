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

  test('validates lead status and appends notes', async () => {
    const created = await request(app).post('/api/internal/leads').send({
      userId: `lead-status-${Date.now()}`,
      businessName: 'Status Market',
      status: 'new',
    });
    const invalid = await request(app)
      .patch(`/api/internal/leads/${created.body.id}/status`)
      .send({ status: 'invalid-state' });
    const noted = await request(app)
      .post(`/api/internal/leads/${created.body.id}/notes`)
      .send({ note: 'Call buyer on Tuesday.' });

    expect(invalid.statusCode).toBe(400);
    expect(noted.body.notes).toContain('Call buyer on Tuesday.');
  });

  test('supports internal product search and order detail', async () => {
    const product = await request(app)
      .get('/api/internal/products/search?q=chamoy');
    const order = await request(app).get('/api/internal/orders/123');
    const sync = await request(app).post('/api/internal/products/sync-mocks');

    expect(product.body[0].sku).toBe('CHAMOY-1L');
    expect(order.body.id).toBe('123');
    expect(sync.statusCode).toBe(409);
  });
});
