const COMMERCE_OS_CAPABILITIES = Object.freeze([
  'catalog',
  'inventory',
  'order_intake',
  'accounting',
  'tax_invoicing',
  'fulfillment',
  'customer_notifications',
  'b2b_sales',
  'approvals',
  'operational_dashboard',
]);

const CONNECTOR_MODES = Object.freeze(['disabled', 'manual', 'read_only', 'read_write']);

const commerceOsError = (message, code, details) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 422;
  if (details) error.details = details;
  return error;
};

module.exports = { COMMERCE_OS_CAPABILITIES, CONNECTOR_MODES, commerceOsError };
