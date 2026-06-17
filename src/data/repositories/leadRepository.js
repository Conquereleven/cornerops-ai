const { randomUUID } = require('crypto');
const mockLeads = require('../mockLeads');
const {
  supabase,
  isSupabaseEnabled,
} = require('../supabase/supabaseClient');
const {
  clampLimit,
  compact,
  throwSupabaseError,
  trySupabase,
} = require('./repositoryUtils');

const LEAD_STATUSES = Object.freeze([
  'new',
  'qualified',
  'contacted',
  'quoted',
  'won',
  'lost',
]);

const mapLead = (row) => ({
  id: row.id,
  leadId: row.lead_id || row.id,
  userId: row.user_id,
  businessName: row.business_name,
  city: row.city,
  emirate: row.emirate || row.city,
  businessType: row.business_type,
  productsOfInterest: row.products_of_interest || [],
  requestedProducts: row.requested_products || row.products_of_interest || [],
  estimatedVolume: row.estimated_volume,
  contactName: row.contact_name,
  email: row.email,
  whatsapp: row.whatsapp,
  phone: row.phone || row.whatsapp,
  contact: row.email || row.whatsapp || row.contact_name || '',
  status: row.status,
  missingFields: row.missing_fields || [],
  source: row.source,
  notes: row.notes,
  metadata: row.metadata || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeMockLead = (lead) => ({
  ...lead,
  contact: lead.email || lead.whatsapp || lead.contactName || lead.contact || '',
});

const toLeadRow = (data) => {
  const genericContact = data.contact;
  const isEmail = typeof genericContact === 'string' && genericContact.includes('@');
  return compact({
    user_id: data.userId,
    lead_id: data.leadId,
    business_name: data.businessName,
    city: data.city ?? data.emirate,
    business_type: data.businessType,
    products_of_interest: data.productsOfInterest ?? data.requestedProducts,
    estimated_volume: data.estimatedVolume,
    contact_name: data.contactName,
    email: data.email ?? (isEmail ? genericContact : undefined),
    whatsapp:
      data.whatsapp ??
      data.phone ??
      (genericContact && !isEmail ? genericContact : undefined),
    status: data.status,
    missing_fields: data.missingFields,
    source: data.source,
    notes: data.notes,
    metadata: data.metadata,
  });
};

const createLead = async (data) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('create lead', async () => {
      const databaseId = randomUUID();
      const { data: created, error } = await supabase
        .from('b2b_leads')
        .insert({
          id: databaseId,
          lead_id: data.leadId || databaseId,
          status: 'new',
          source: 'ai_worker',
          ...toLeadRow(data),
        })
        .select()
        .single();
      throwSupabaseError(error, 'create lead');
      return mapLead(created);
    });
    if (result.ok) return result.value;
  }

  const now = new Date().toISOString();
  const lead = {
    id: `lead-${randomUUID().slice(0, 8)}`,
    status: 'new',
    source: 'ai_worker',
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  lead.leadId = lead.leadId || lead.id;
  const normalizedLead = normalizeMockLead(lead);
  mockLeads.push(normalizedLead);
  return { ...normalizedLead };
};

const updateLead = async (leadId, data) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('update lead', async () => {
      const { data: updated, error } = await supabase
        .from('b2b_leads')
        .update(toLeadRow(data))
        .eq('id', leadId)
        .select()
        .maybeSingle();
      throwSupabaseError(error, 'update lead');
      return updated ? mapLead(updated) : null;
    });
    if (result.ok) return result.value;
  }

  const lead = mockLeads.find((item) => item.id === leadId);
  if (!lead) return null;
  Object.assign(lead, data, { updatedAt: new Date().toISOString() });
  Object.assign(lead, normalizeMockLead(lead));
  return { ...lead };
};

const updateB2BLeadStatus = async (leadId, status) => {
  if (!LEAD_STATUSES.includes(status)) {
    const error = new Error(`Invalid lead status: ${status}`);
    error.statusCode = 400;
    throw error;
  }
  return updateLead(leadId, { status });
};

const addB2BLeadNote = async (leadId, note) => {
  const cleanNote = String(note || '').trim();
  if (!cleanNote) {
    const error = new Error('note is required.');
    error.statusCode = 400;
    throw error;
  }
  const lead = await getLeadById(leadId);
  if (!lead) return null;
  const notes = [lead.notes, cleanNote].filter(Boolean).join('\n');
  return updateLead(leadId, { notes });
};

const getLeadById = async (leadId) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('get lead', async () => {
      const { data, error } = await supabase
        .from('b2b_leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
      throwSupabaseError(error, 'get lead');
      return data ? mapLead(data) : null;
    });
    if (result.ok) return result.value;
  }
  const lead = mockLeads.find((item) => item.id === leadId);
  return lead ? normalizeMockLead(lead) : null;
};

const findLatestLeadByUserId = async (userId) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('find latest user lead', async () => {
      const { data, error } = await supabase
        .from('b2b_leads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      throwSupabaseError(error, 'find latest user lead');
      return data ? mapLead(data) : null;
    });
    if (result.ok) return result.value;
  }
  const lead = [...mockLeads].reverse().find((item) => item.userId === userId);
  return lead ? normalizeMockLead(lead) : null;
};

const listLeads = async ({ limit = 100, status } = {}) => {
  const safeLimit = clampLimit(limit);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('list leads', async () => {
      let query = supabase
        .from('b2b_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(safeLimit);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      throwSupabaseError(error, 'list leads');
      return data.map(mapLead);
    });
    if (result.ok) return result.value;
  }
  return mockLeads
    .filter((lead) => !status || lead.status === status)
    .slice(0, safeLimit)
    .map(normalizeMockLead);
};

module.exports = {
  createLead,
  createB2BLead: createLead,
  updateLead,
  updateB2BLeadStatus,
  addB2BLeadNote,
  getLeadById,
  getB2BLeadById: getLeadById,
  findLatestLeadByUserId,
  listLeads,
  listB2BLeads: listLeads,
  LEAD_STATUSES,
};
