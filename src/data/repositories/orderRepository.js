const mockOrders = require('../mockOrders');
const {
  supabase,
  isSupabaseEnabled,
} = require('../supabase/supabaseClient');
const {
  clampLimit,
  throwSupabaseError,
  trySupabase,
} = require('./repositoryUtils');

const mapOrder = (row) => ({
  id: row.order_number,
  databaseId: row.id,
  userId: row.user_id,
  customerName: row.customer_name || '',
  email: row.email || '',
  status: row.status || '',
  paymentStatus: row.payment_status || '',
  deliveryStatus: row.delivery_status || '',
  items: (row.order_items || []).map((item) => ({
    sku: item.sku,
    name: item.name,
    quantity: item.quantity,
    priceAED: item.price_aed === null ? null : Number(item.price_aed),
  })),
  estimatedDelivery: row.estimated_delivery,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findOrderById = async (orderNumber) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('find order', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', String(orderNumber))
        .maybeSingle();
      throwSupabaseError(error, 'find order');
      return data ? mapOrder(data) : null;
    });
    if (result.ok) return result.value;
  }
  return mockOrders.find((order) => order.id === String(orderNumber)) || null;
};

const findOrdersByUserId = async (userId) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('find user orders', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', String(userId))
        .order('created_at', { ascending: false });
      throwSupabaseError(error, 'find user orders');
      return data.map(mapOrder);
    });
    if (result.ok) return result.value;
  }
  return mockOrders.filter((order) => order.userId === String(userId));
};

const findOrderByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  if (isSupabaseEnabled()) {
    const result = await trySupabase('find order by email', async () => {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('external_user_id')
        .ilike('email', normalizedEmail)
        .maybeSingle();
      throwSupabaseError(customerError, 'find customer by email');
      if (!customer?.external_user_id) return null;
      const orders = await findOrdersByUserId(customer.external_user_id);
      return orders[0] || null;
    });
    if (result.ok) return result.value;
  }

  return mockOrders.find(
    (order) => String(order.email || '').toLowerCase() === normalizedEmail,
  ) || null;
};

const listOrders = async ({ limit = 100, status } = {}) => {
  const safeLimit = clampLimit(limit);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('list orders', async () => {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(safeLimit);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      throwSupabaseError(error, 'list orders');
      return data.map(mapOrder);
    });
    if (result.ok) return result.value;
  }
  return mockOrders
    .filter((order) => !status || order.status === status)
    .slice(0, safeLimit)
    .map((order) => ({ ...order, items: order.items.map((item) => ({ ...item })) }));
};

module.exports = {
  findOrderById,
  findOrderByEmail,
  findOrdersByUserId,
  listOrders,
};
