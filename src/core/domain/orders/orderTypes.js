const ORDER_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'payment_pending',
  'paid',
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'unknown',
]);

const PAYMENT_METHODS = Object.freeze([
  'card',
  'bank_transfer',
  'cod',
  'cash',
  'manual',
  'unknown',
]);

const PAYMENT_STATUSES = Object.freeze([
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
  'unknown',
]);

module.exports = {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
};
