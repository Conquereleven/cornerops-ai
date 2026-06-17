process.env.NODE_ENV = 'test';

const repository = require('../src/data/repositories/customerRepository');

describe('customerRepository', () => {
  test('finds, creates, and lists customers in fallback mode', async () => {
    const existing = await repository.findCustomerByEmail(
      'rodrigo@example.com',
    );
    const created = await repository.createCustomer({
      name: 'Sprint 6 Buyer',
      email: 'sprint6@example.com',
      phone: '+971500000999',
      customerType: 'b2b',
    });
    const customers = await repository.listCustomers({ limit: 100 });

    expect(existing.customerId).toBe('1');
    expect(created.source).toBe('mock');
    expect(customers.some((customer) => customer.id === created.id)).toBe(true);
  });
});
