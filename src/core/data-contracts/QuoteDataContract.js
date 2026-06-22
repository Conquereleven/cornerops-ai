const quoteDataContract = {
  entity: 'quote',
  sourceName: 'cornerops-business-data',
  sourceTable: 'quotes',
  fields: [
    { canonicalField: 'id', aliases: ['id', 'quote_id'], required: true, piiLevel: 'none' },
    { canonicalField: 'quoteNumber', aliases: ['quoteNumber', 'quote_number'], required: true, piiLevel: 'none' },
    { canonicalField: 'leadId', aliases: ['leadId', 'lead_id'], required: false, piiLevel: 'none' },
    { canonicalField: 'customerName', aliases: ['customerName', 'customer_name'], required: false, piiLevel: 'high' },
    { canonicalField: 'companyName', aliases: ['companyName', 'company_name'], required: false, piiLevel: 'low' },
    { canonicalField: 'status', aliases: ['status', 'quote_status'], required: true, transform: 'normalize_status', piiLevel: 'none' },
    { canonicalField: 'currency', aliases: ['currency'], required: true, piiLevel: 'none' },
    { canonicalField: 'total', aliases: ['total', 'total_amount'], required: true, transform: 'number', piiLevel: 'none' },
    { canonicalField: 'items', aliases: ['items', 'quote_items'], required: false, transform: 'normalize_items', piiLevel: 'none' },
    { canonicalField: 'createdAt', aliases: ['createdAt', 'created_at'], required: true, transform: 'iso_timestamp', piiLevel: 'none' },
    { canonicalField: 'nextFollowUpAt', aliases: ['nextFollowUpAt', 'next_follow_up_at'], required: false, transform: 'iso_timestamp', piiLevel: 'none' },
  ],
};

module.exports = { quoteDataContract };
