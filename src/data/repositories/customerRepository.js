const { randomUUID } = require('crypto');
const mockCustomers = require('../mockCustomers');
const {
  supabase,
  isSupabaseEnabled,
} = require('../supabase/supabaseClient');
const {
  clampLimit,
  throwSupabaseError,
  trySupabase,
} = require('./repositoryUtils');

const mapCustomer = (row) => ({
  id: row.id,
  customerId: row.external_user_id,
  name: row.name || '',
  email: row.email || '',
  phone: row.whatsapp || '',
  customerType: row.customer_type || 'retail',
  metadata: row.metadata || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  source: 'supabase',
});

const normalizeMockCustomer = (customer) => ({
  ...customer,
  customerId: customer.customerId || customer.id,
  email: customer.email || '',
  phone: customer.phone || '',
  customerType: customer.customerType || 'retail',
  metadata: customer.metadata || {},
  source: 'mock',
});

const findCustomerByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  if (isSupabaseEnabled()) {
    const result = await trySupabase('find customer by email', async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();
      throwSupabaseError(error, 'find customer by email');
      return data ? mapCustomer(data) : null;
    });
    if (result.ok) return result.value;
  }
  const customer = mockCustomers.find(
    (item) => String(item.email || '').toLowerCase() === normalizedEmail,
  );
  return customer ? normalizeMockCustomer(customer) : null;
};

const createCustomer = async (data) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('create customer', async () => {
      const { data: created, error } = await supabase
        .from('customers')
        .insert({
          external_user_id: data.customerId || data.userId,
          name: data.name,
          email: data.email,
          whatsapp: data.phone,
          preferred_language: data.preferredLanguage || 'es',
        })
        .select()
        .single();
      throwSupabaseError(error, 'create customer');
      return mapCustomer(created);
    });
    if (result.ok) return result.value;
  }

  const customer = normalizeMockCustomer({
    id: data.customerId || `customer-${randomUUID().slice(0, 8)}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  mockCustomers.push(customer);
  return { ...customer };
};

const listCustomers = async ({ limit = 100 } = {}) => {
  const safeLimit = clampLimit(limit);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('list customers', async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(safeLimit);
      throwSupabaseError(error, 'list customers');
      return data.map(mapCustomer);
    });
    if (result.ok) return result.value;
  }
  return mockCustomers.slice(0, safeLimit).map(normalizeMockCustomer);
};

module.exports = {
  createCustomer,
  findCustomerByEmail,
  listCustomers,
};
