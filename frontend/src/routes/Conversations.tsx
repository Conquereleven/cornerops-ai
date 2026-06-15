import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '../components/tables/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useConversations } from '../hooks/useConversations';
import type { Conversation } from '../lib/types';

export function ResourcePage({ title, subtitle, loading, offline, error, onRetry, search, setSearch, actions, children }: { title: string; subtitle: string; loading: boolean; offline: boolean; error?: string; onRetry?: () => void; search: string; setSearch: (value: string) => void; actions?: ReactNode; children: ReactNode }) {
  return <div><div className="page-title"><div><span className="eyebrow">Operations data</span><h1>{title}</h1><p>{subtitle}</p></div>{offline ? <StatusBadge tone="amber">Datos fallback</StatusBadge> : <StatusBadge tone="green">Datos persistentes</StatusBadge>}</div>{error && <div className="resource-error"><span>{error}</span>{onRetry && <button onClick={onRetry}>Reintentar</button>}</div>}<section className="panel resource-panel"><div className="resource-toolbar"><label><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar en ${title.toLowerCase()}…`} /></label><div className="resource-actions">{actions}<span>{loading ? 'Sincronizando…' : 'Actualizado ahora'}</span></div></div>{children}</section></div>;
}

export function Conversations() {
  const [query, setQuery] = useState('');
  const [worker, setWorker] = useState('all');
  const [intent, setIntent] = useState('all');
  const { data, loading, offline, error, refresh } = useConversations({
    worker: worker === 'all' ? undefined : worker,
    intent: intent === 'all' ? undefined : intent,
  });
  const rows = useMemo(() => data.filter((item) =>
    `${item.userId} ${item.lastMessage} ${item.worker}`.toLowerCase().includes(query.toLowerCase())
  ), [data, query]);
  return <ResourcePage title="Conversations" subtitle="Historial persistente, contexto y estado de resolución." loading={loading} offline={offline} error={error} onRetry={() => void refresh()} search={query} setSearch={setQuery} actions={<><select aria-label="Filtrar por worker" value={worker} onChange={(event) => setWorker(event.target.value)}><option value="all">Todos los workers</option><option value="supportWorker">supportWorker</option><option value="salesWorker">salesWorker</option><option value="ordersWorker">ordersWorker</option><option value="b2bWorker">b2bWorker</option><option value="humanHandoffWorker">humanHandoffWorker</option></select><select aria-label="Filtrar por intent" value={intent} onChange={(event) => setIntent(event.target.value)}><option value="all">Todos los intents</option><option value="support">support</option><option value="product_search">product_search</option><option value="order_status">order_status</option><option value="b2b_lead">b2b_lead</option><option value="human_handoff">human_handoff</option></select></>}><DataTable<Conversation> rows={rows} keyFor={(row) => row.id} empty={loading ? 'Cargando conversaciones…' : 'No hay conversaciones para estos filtros.'} columns={[
    { label: 'Conversation ID', render: (row) => <code>{row.id}</code> },
    { label: 'User ID', render: (row) => row.userId },
    { label: 'Último mensaje', render: (row) => <span className="cell-primary">{row.lastMessage}</span> },
    { label: 'Worker', render: (row) => <StatusBadge>{row.worker}</StatusBadge> },
    { label: 'Intent', render: (row) => <StatusBadge tone="blue">{row.intent}</StatusBadge> },
    { label: 'Estado', render: (row) => <StatusBadge tone={row.status === 'needs_human' ? 'amber' : 'green'}>{row.status}</StatusBadge> },
  ]} /></ResourcePage>;
}
