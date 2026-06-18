class OrderRepository {
  constructor({ adapter, normalizer }) {
    this.adapter = adapter;
    this.normalizer = normalizer;
  }

  async listOrders(filters = {}) {
    return this.adapter.listOrders()
      .filter((order) => !filters.status || order.status === filters.status)
      .map((order) => this.normalizer.normalizeOrder(order));
  }

  async getOrderById(id) {
    const orders = await this.listOrders();
    return orders.find((order) => order.id === id || order.orderNumber === id) || null;
  }

  async findOrdersRequiringAction() {
    const orders = await this.listOrders();
    return orders.filter((order) =>
      ['pending', 'payment_pending', 'confirmed'].includes(order.status)
      || ['pending', 'unpaid'].includes(order.paymentStatus));
  }

  async findManualPaymentOrders() {
    const orders = await this.listOrders();
    return orders.filter((order) =>
      ['bank_transfer', 'cod', 'manual'].includes(order.paymentMethod)
      && order.paymentStatus !== 'paid');
  }
}

module.exports = {
  OrderRepository,
};
