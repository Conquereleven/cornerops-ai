class OrderService {
  constructor({ auditLogService, repository } = {}) {
    this.auditLogService = auditLogService;
    this.repository = repository;
  }

  async audit(context, operation, output) {
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'orders',
      operation,
      output: { count: Array.isArray(output) ? output.length : output ? 1 : 0 },
      status: 'success',
    });
  }

  async listOrders(filters = {}, context = {}) {
    const orders = await this.repository.listOrders(filters);
    await this.audit(context, 'listOrders', orders);
    return orders;
  }

  async getOrderById(id, context = {}) {
    const order = await this.repository.getOrderById(id);
    await this.audit(context, 'getOrderById', order);
    return order;
  }

  async findOrdersRequiringAction(context = {}) {
    const orders = await this.repository.findOrdersRequiringAction();
    await this.audit(context, 'findOrdersRequiringAction', orders);
    return orders;
  }

  async findManualPaymentOrders(context = {}) {
    const orders = await this.repository.findManualPaymentOrders();
    await this.audit(context, 'findManualPaymentOrders', orders);
    return orders;
  }
}

module.exports = {
  OrderService,
};
