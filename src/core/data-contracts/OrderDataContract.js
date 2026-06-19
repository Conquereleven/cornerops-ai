const orderDataContract = {
  entity: 'order',
  sourceName: 'cornerops-business-data',
  sourceTable: 'orders',
  fields: [
    { canonicalField: 'id', aliases: ['id', 'order_id'], required: true, piiLevel: 'none' },
    { canonicalField: 'orderNumber', aliases: ['orderNumber', 'order_number'], required: true, piiLevel: 'none' },
    { canonicalField: 'customerName', aliases: ['customerName', 'customer_name'], required: false, piiLevel: 'high' },
    { canonicalField: 'companyName', aliases: ['companyName', 'company_name'], required: false, piiLevel: 'low' },
    { canonicalField: 'status', aliases: ['status', 'order_status'], required: true, transform: 'normalize_status', piiLevel: 'none' },
    { canonicalField: 'paymentStatus', aliases: ['paymentStatus', 'payment_status'], required: true, transform: 'normalize_status', piiLevel: 'none' },
    { canonicalField: 'paymentMethod', aliases: ['paymentMethod', 'payment_method'], required: true, transform: 'normalize_status', piiLevel: 'none' },
    { canonicalField: 'currency', aliases: ['currency'], required: true, piiLevel: 'none' },
    { canonicalField: 'total', aliases: ['total', 'total_amount'], required: true, transform: 'number', piiLevel: 'none' },
    { canonicalField: 'items', aliases: ['items', 'order_items'], required: false, transform: 'normalize_items', piiLevel: 'none' },
    { canonicalField: 'notes', aliases: ['notes', 'internal_notes'], required: false, piiLevel: 'medium' },
    { canonicalField: 'createdAt', aliases: ['createdAt', 'created_at'], required: true, transform: 'iso_timestamp', piiLevel: 'none' },
  ],
};

module.exports = { orderDataContract };
