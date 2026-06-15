import { useMemo, useState } from 'react';
import { DataTable } from '../components/tables/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useLeads } from '../hooks/useLeads';
import type { B2BLead } from '../lib/types';
import { ResourcePage } from './Conversations';

export function Leads() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const { data, loading, offline, error, refresh } = useLeads(
    status === 'all' ? undefined : status,
  );
  const rows = useMemo(() => data.filter((lead) =>
    `${lead.businessName} ${lead.city} ${lead.businessType}`.toLowerCase().includes(query.toLowerCase())
  ), [data, query]);
  return <ResourcePage title="B2B Leads" subtitle="Oportunidades persistentes y datos pendientes." loading={loading} offline={offline} error={error} onRetry={() => void refresh()} search={query} setSearch={setQuery} actions={<select aria-label="Filtrar por estado" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos los estados</option><option value="new">new</option><option value="needs_info">needs_info</option><option value="qualified">qualified</option><option value="contacted">contacted</option><option value="closed">closed</option></select>}><DataTable<B2BLead> rows={rows} keyFor={(row) => row.id} empty={loading ? 'Cargando leads…' : 'No hay leads para estos filtros.'} columns={[
    { label: 'Lead ID', render: (row) => <code>{row.id}</code> },
    { label: 'Business', render: (row) => <span className="cell-primary">{row.businessName || 'Por confirmar'}</span> },
    { label: 'City', render: (row) => row.city || 'Pendiente' },
    { label: 'Type', render: (row) => row.businessType || 'Pendiente' },
    { label: 'Products', render: (row) => row.productsOfInterest?.join(', ') || 'Pendiente' },
    { label: 'Volume', render: (row) => row.estimatedVolume || 'Pendiente' },
    { label: 'Contact', render: (row) => row.contact || 'Pendiente' },
    { label: 'Status', render: (row) => <StatusBadge tone={row.status === 'qualified' ? 'green' : 'amber'}>{row.status}</StatusBadge> },
  ]} /></ResourcePage>;
}
