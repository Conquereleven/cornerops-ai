process.env.NODE_ENV = 'test';

const request = require('supertest');
const { authed, installTestAppAuth } = require('./helpers/appAuth');

installTestAppAuth();
const app = require('../src/app');
const leadRepository = require('../src/data/repositories/leadRepository');

describe('Leads API', () => {
  test('gets, updates, and filters a lead', async () => {
    const lead = await leadRepository.createLead({
      userId: `lead-api-${Date.now()}`,
      businessName: 'API Market',
      status: 'needs_info',
      missingFields: ['contact'],
    });
    const updated = await authed(app)
      .patch(`/api/leads/${lead.id}`)
      .send({ status: 'qualified', email: 'api@market.example', missingFields: [] });
    const detail = await authed(app).get(`/api/leads/${lead.id}`);
    const list = await authed(app).get('/api/leads?status=qualified');

    expect(updated.body.status).toBe('qualified');
    expect(detail.body.contact).toBe('api@market.example');
    expect(list.body.some((item) => item.id === lead.id)).toBe(true);
  });
});
