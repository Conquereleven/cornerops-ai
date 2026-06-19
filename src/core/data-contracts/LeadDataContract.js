const leadDataContract = {
  entity: 'lead',
  sourceName: 'cornerops-business-data',
  sourceTable: 'leads',
  fields: [
    { canonicalField: 'id', aliases: ['id', 'lead_id'], required: true, piiLevel: 'none' },
    { canonicalField: 'companyName', aliases: ['companyName', 'company_name', 'business_name'], required: true, piiLevel: 'low' },
    { canonicalField: 'contactName', aliases: ['contactName', 'contact_name', 'name'], required: false, piiLevel: 'high' },
    { canonicalField: 'email', aliases: ['email', 'contact_email'], required: false, piiLevel: 'high' },
    { canonicalField: 'phone', aliases: ['phone', 'mobile', 'whatsapp'], required: false, piiLevel: 'high' },
    { canonicalField: 'status', aliases: ['status', 'lead_status'], required: true, transform: 'normalize_status', piiLevel: 'none' },
    { canonicalField: 'source', aliases: ['source', 'lead_source'], required: false, piiLevel: 'low' },
    { canonicalField: 'interestedProducts', aliases: ['interestedProducts', 'interested_products', 'products_of_interest'], required: false, transform: 'normalize_array', piiLevel: 'none' },
    { canonicalField: 'priority', aliases: ['priority'], required: false, piiLevel: 'none' },
    { canonicalField: 'notes', aliases: ['notes', 'internal_notes'], required: false, piiLevel: 'medium' },
    { canonicalField: 'createdAt', aliases: ['createdAt', 'created_at'], required: true, transform: 'iso_timestamp', piiLevel: 'none' },
    { canonicalField: 'updatedAt', aliases: ['updatedAt', 'updated_at'], required: false, transform: 'iso_timestamp', piiLevel: 'none' },
    { canonicalField: 'lastContactedAt', aliases: ['lastContactedAt', 'last_contacted_at'], required: false, transform: 'iso_timestamp', piiLevel: 'none' },
  ],
};

module.exports = { leadDataContract };
