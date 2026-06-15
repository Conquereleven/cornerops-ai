import { useMemo, useState } from 'react';
import { DataTable } from '../components/tables/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useOrders } from '../hooks/useOrders';
import type { Order } from '../lib/types';
import { ResourcePage } from './Conversations';

export function Orders() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const { data, loading, offline, error, refresh } = useOrders(
    status === 'all' ? undefined : status,
  );
  const rows = useMemo(() => data.filter((order) => `${order.id} ${order.customerName} ${order.status}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  return <ResourcePage title="Orders" subtitle="Órdenes persistentes, pago, preparación y entrega." loading={loading} offline={offline} error={error} onRetry={() => void refresh()} search={query} setSearch={setQuery} actions={<select aria-label="Filtrar órdenes por estado" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos los estados</option><option value="preparing">preparing</option><option value="confirmed">confirmed</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option></select>}><DataTable<Order> rows={rows} keyFor={(row) => row.id} empty={loading ? 'Cargando órdenes…' : 'No hay órdenes para estos filtros.'} columns={[
    { label: 'Order ID', render: (row) => <code>#{row.id}</code> },
    { label: 'Customer', render: (row) => <span className="cell-primary">{row.customerName}</span> },
    { label: 'Status', render: (row) => <StatusBadge tone="blue">{row.status}</StatusBadge> },
    { label: 'Payment', render: (row) => <StatusBadge tone={row.paymentStatus === 'paid' ? 'green' : 'amber'}>{row.paymentStatus}</StatusBadge> },
    { label: 'Delivery', render: (row) => row.deliveryStatus },
    { label: 'Items', render: (row) => row.items.map((item) => `${item.quantity}× ${item.name}`).join(', ') },
    { label: 'ETA', render: (row) => row.estimatedDelivery || 'Por confirmar' },
  ]} /></ResourcePage>;
}
