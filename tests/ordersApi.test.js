process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Orders API', () => {
  test('lists orders with filters and gets order 123', async () => {
    const list = await request(app).get('/api/orders?status=preparing');
    const detail = await request(app).get('/api/orders/123');
    expect(list.statusCode).toBe(200);
    expect(list.body.every((order) => order.status === 'preparing')).toBe(true);
    expect(detail.body.id).toBe('123');
  });
});
