const { applyDataContract, makeMeta } = require('../business/businessTypes');

class OrderReadOnlyRepository {
  constructor({ adapter, contractRegistry, maxRows = 100, normalizer } = {}) {
    this.adapter = adapter;
    this.contractRegistry = contractRegistry;
    this.maxRows = maxRows;
    this.normalizer = normalizer;
  }

  async list(filters = {}, context = {}) {
    const result = await this.adapter.select({ table: 'orders', limit: this.maxRows }, context);
    const mapping = this.contractRegistry.getMapping('order');
    const data = result.rows
      .map((row) => this.normalizer.normalizeOrder(applyDataContract(row, mapping)))
      .filter((order) => !filters.status || order.status === filters.status);
    return { data, meta: makeMeta({ ...result, rowCount: data.length, warnings: mapping?.warnings || [] }) };
  }

  async getById(id, context = {}) {
    const result = await this.list({}, context);
    const order = result.data.find((item) => item.id === String(id) || item.orderNumber === id) || null;
    return { data: order, meta: makeMeta({ ...result.meta, rowCount: order ? 1 : 0 }) };
  }

  async findRequiringAction(context = {}) {
    const result = await this.list({}, context);
    const data = result.data.filter((order) =>
      ['pending', 'payment_pending', 'confirmed'].includes(order.status)
      || ['pending', 'unpaid'].includes(order.paymentStatus));
    return { data, meta: makeMeta({ ...result.meta, rowCount: data.length }) };
  }

  async findManualPayments(context = {}) {
    const result = await this.list({}, context);
    const data = result.data.filter((order) =>
      ['bank_transfer', 'cod', 'manual'].includes(order.paymentMethod)
      && order.paymentStatus !== 'paid');
    return { data, meta: makeMeta({ ...result.meta, rowCount: data.length }) };
  }
}

module.exports = { OrderReadOnlyRepository };
