process.env.NODE_ENV = 'test';

const repository = require('../src/data/repositories/leadRepository');

describe('leadRepository', () => {
  test('creates, updates, gets, and lists leads', async () => {
    const userId = `lead-repository-${Date.now()}`;
    const created = await repository.createLead({
      userId,
      businessName: 'Sprint 3 Café',
      city: 'Dubai',
      status: 'needs_info',
      missingFields: ['contact'],
    });
    const updated = await repository.updateLead(created.id, {
      status: 'qualified',
      contact: 'buyer@sprint3.example',
      missingFields: [],
    });
    const stored = await repository.getLeadById(created.id);
    const latest = await repository.findLatestLeadByUserId(userId);
    const qualified = await repository.listLeads({ status: 'qualified' });

    expect(updated.status).toBe('qualified');
    expect(stored.contact).toBe('buyer@sprint3.example');
    expect(latest.id).toBe(created.id);
    expect(qualified.some((lead) => lead.id === created.id)).toBe(true);
  });
});
