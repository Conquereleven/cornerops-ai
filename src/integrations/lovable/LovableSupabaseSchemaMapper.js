const { makeEvidence } = require('../../core/data-contracts/cornermex/CornerMexSchemaEvidenceService');

const CORE_TABLES = Object.freeze([
  {
    tableName: 'products',
    relatedContract: 'product',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'name_en', type: 'text', nullable: false },
      { name: 'name_es', type: 'text', nullable: false },
      { name: 'slug', type: 'text', nullable: false },
      { name: 'status', type: 'product_status', nullable: false },
      { name: 'seller_id', type: 'uuid', nullable: true },
    ],
    foreignKeys: ['seller_id -> sellers.id'],
    enums: ['product_status'],
  },
  {
    tableName: 'product_variants',
    relatedContract: 'product',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'product_id', type: 'uuid', nullable: false },
      { name: 'sku', type: 'text', nullable: true },
      { name: 'price_aed', type: 'numeric', nullable: false },
      { name: 'stock_qty', type: 'integer', nullable: false },
    ],
    foreignKeys: ['product_id -> products.id'],
  },
  {
    tableName: 'b2b_leads',
    relatedContract: 'lead',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'full_name', type: 'text', nullable: false },
      { name: 'email', type: 'text', nullable: false },
      { name: 'phone', type: 'text', nullable: true },
      { name: 'company', type: 'text', nullable: true },
      { name: 'products_interest', type: 'text', nullable: true },
      { name: 'status', type: 'b2b_lead_status', nullable: false },
    ],
    enums: ['b2b_lead_status'],
  },
  {
    tableName: 'b2b_leads',
    relatedContract: 'quote',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'company', type: 'text', nullable: true },
      { name: 'products_interest', type: 'text', nullable: true },
      { name: 'estimated_volume', type: 'text', nullable: true },
      { name: 'status', type: 'b2b_lead_status', nullable: false },
      { name: 'admin_note', type: 'text', nullable: true },
    ],
    enums: ['b2b_lead_status'],
    warnings: ['Quote contract maps to B2B lead/quote workflow evidence until a dedicated quote table is confirmed live.'],
  },
  {
    tableName: 'lead_notes',
    relatedContract: 'lead',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'lead_id', type: 'uuid', nullable: false },
      { name: 'body', type: 'text', nullable: false },
      { name: 'author_id', type: 'uuid', nullable: true },
    ],
    foreignKeys: ['lead_id -> b2b_leads.id'],
  },
  {
    tableName: 'orders',
    relatedContract: 'order',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'order_number', type: 'text', nullable: false },
      { name: 'buyer_id', type: 'uuid', nullable: false },
      { name: 'status', type: 'order_status', nullable: false },
      { name: 'payment_method', type: 'payment_method', nullable: false },
      { name: 'payment_status', type: 'payment_status', nullable: false },
      { name: 'shipping_address', type: 'jsonb', nullable: false },
      { name: 'total_aed', type: 'numeric', nullable: false },
    ],
    enums: ['order_status', 'payment_method', 'payment_status'],
  },
  {
    tableName: 'order_items',
    relatedContract: 'order',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'order_id', type: 'uuid', nullable: false },
      { name: 'product_id', type: 'uuid', nullable: false },
      { name: 'qty', type: 'integer', nullable: false },
      { name: 'unit_price_aed', type: 'numeric', nullable: false },
    ],
    foreignKeys: ['order_id -> orders.id', 'product_id -> products.id'],
  },
  {
    tableName: 'order_events',
    relatedContract: 'order',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'order_id', type: 'uuid', nullable: false },
      { name: 'kind', type: 'text', nullable: false },
      { name: 'payload', type: 'jsonb', nullable: false },
    ],
    foreignKeys: ['order_id -> orders.id'],
  },
  {
    tableName: 'addresses',
    relatedContract: 'customer',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'recipient_name', type: 'text', nullable: false },
      { name: 'phone', type: 'text', nullable: false },
      { name: 'emirate', type: 'emirate', nullable: false },
      { name: 'area', type: 'text', nullable: false },
    ],
    enums: ['emirate'],
  },
  {
    tableName: 'profiles',
    relatedContract: 'customer',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'full_name', type: 'text', nullable: true },
      { name: 'phone', type: 'text', nullable: true },
      { name: 'email', type: 'text', nullable: true },
    ],
    warnings: ['Profiles table is inferred from generated types/routes and may need live schema confirmation.'],
  },
  {
    tableName: 'orders',
    relatedContract: 'payment',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'payment_method', type: 'payment_method', nullable: false },
      { name: 'payment_status', type: 'payment_status', nullable: false },
      { name: 'paid_at', type: 'timestamp', nullable: true },
      { name: 'total_aed', type: 'numeric', nullable: false },
    ],
    enums: ['payment_method', 'payment_status'],
    warnings: ['Payments are currently represented through order payment fields until a dedicated payments table is confirmed.'],
  },
]);

class LovableSupabaseSchemaMapper {
  map({ migrationFiles = [], sourceFilePath = 'src/integrations/supabase/types.ts' } = {}) {
    if (!migrationFiles.length) {
      return {
        schemaEvidence: [],
        tables: [],
        contracts: [],
        confidence: 'low',
        piiCandidateFields: [],
      };
    }
    const rls = ['RLS policies present in migrations; verify live Supabase policies before enabling real_read_only.'];
    const schemaEvidence = CORE_TABLES.map((table) => makeEvidence({
      ...table,
      sourceFilePath,
      rls,
      confidenceScore: migrationFiles.length ? 0.76 : 0.55,
    }));
    return {
      schemaEvidence,
      tables: [...new Set(schemaEvidence.map((item) => item.tableName))],
      contracts: [...new Set(schemaEvidence.map((item) => item.relatedCornerMexContract))],
      confidence: migrationFiles.length ? 'medium' : 'low',
      piiCandidateFields: [...new Set(schemaEvidence.flatMap((item) => item.columns)
        .filter((column) => column.piiClassification === 'pii_candidate')
        .map((column) => column.name))],
    };
  }
}

module.exports = { LovableSupabaseSchemaMapper, CORE_TABLES };
