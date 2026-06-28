const CORNERMEX_SCHEMA_EVIDENCE_SOURCES = Object.freeze({
  MIGRATION: 'supabase_migration',
  GENERATED_TYPES: 'supabase_generated_types',
  MOCK: 'mock_schema_evidence',
});

const CORNERMEX_CONTRACT_TABLE_MAP = Object.freeze({
  product: ['products', 'product_variants', 'categories'],
  lead: ['b2b_leads', 'lead_notes', 'lead_status_history'],
  quote: ['quote_requests', 'b2b_leads'],
  order: ['orders', 'order_items', 'order_events', 'order_notes'],
  customer: ['profiles', 'addresses', 'customers'],
  payment: ['orders', 'payments', 'payouts'],
});

const PII_COLUMN_HINTS = Object.freeze([
  'email',
  'phone',
  'recipient_name',
  'full_name',
  'shipping_address',
  'billing_address',
  'address',
  'contact',
  'name',
  'whatsapp',
]);

module.exports = {
  CORNERMEX_CONTRACT_TABLE_MAP,
  CORNERMEX_SCHEMA_EVIDENCE_SOURCES,
  PII_COLUMN_HINTS,
};
