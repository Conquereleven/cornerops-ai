process.env.NODE_ENV = 'test';

const repository = require('../src/data/repositories/orderRepository');

describe('orderRepository', () => {
  test('finds order 123 by order number', async () => {
    const order = await repository.findOrderById('123');
    expect(order.id).toBe('123');
    expect(order.items[0].sku).toBe('TAJIN-142G');
  });

  test('filters lists and finds user orders', async () => {
    const delivered = await repository.listOrders({ status: 'delivered' });
    const userOrders = await repository.findOrdersByUserId('1');
    expect(delivered.every((order) => order.status === 'delivered')).toBe(true);
    expect(userOrders.map((order) => order.id)).toEqual(expect.arrayContaining(['123', '110']));
  });

  test('finds the latest order by customer email', async () => {
    const order = await repository.findOrderByEmail('rodrigo@example.com');
    expect(order.id).toBe('123');
  });
});
