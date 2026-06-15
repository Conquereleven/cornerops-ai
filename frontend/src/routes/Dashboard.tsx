import { Activity, Boxes, Database, Handshake, MessageSquareText, PackageSearch, Users } from 'lucide-react';
import { ChatPanel } from '../components/chat/ChatPanel';
import { EventStream } from '../components/dashboard/EventStream';
import { MetricCard } from '../components/dashboard/MetricCard';
import { WorkerPanel } from '../components/dashboard/WorkerPanel';
import { HandoffQueue } from '../components/dashboard/HandoffQueue';
import { useDashboard } from '../hooks/useDashboard';
import { updateHandoff } from '../lib/api';
import { useState } from 'react';

export function Dashboard() {
  const { data, loading, error, refresh } = useDashboard();
  const [busyHandoff, setBusyHandoff] = useState<string>();
  const metrics = data?.metrics;
  const resolveHandoff = async (id: string) => {
    setBusyHandoff(id);
    try {
      await updateHandoff(id, { status: 'resolved' });
      await refresh();
    } finally {
      setBusyHandoff(undefined);
    }
  };
  return <div className="dashboard-page">
    {error && <div className="dashboard-alert">{error}</div>}
    <div className="dashboard-source"><Database size={14} /><span>Data layer</span><strong>{data?.dataSource.mode || 'conectando'}</strong></div>
    <section className="metrics-grid">
      <MetricCard label="Conversaciones" value={loading ? '—' : (metrics?.totalConversations || 0).toLocaleString()} change="Persistidas" icon={MessageSquareText} />
      <MetricCard label="Leads B2B" value={loading ? '—' : (metrics?.totalLeads || 0).toLocaleString()} change="Pipeline capturado" icon={Users} tone="blue" />
      <MetricCard label="Órdenes" value={loading ? '—' : (metrics?.totalOrders || 0).toLocaleString()} change="Repository-backed" icon={PackageSearch} tone="blue" />
      <MetricCard label="Productos activos" value={loading ? '—' : (metrics?.activeProducts || 0).toLocaleString()} change="Catálogo disponible" icon={Boxes} />
      <MetricCard label="Handoffs humanos" value={loading ? '—' : (metrics?.humanHandoffs || 0).toLocaleString()} change="Conversaciones escaladas" icon={Handshake} tone="amber" />
      <MetricCard label="Worker runs" value={loading ? '—' : (metrics?.workerRuns || 0).toLocaleString()} change="Trazabilidad completa" icon={Activity} />
    </section>
    <div className="command-grid"><ChatPanel compact onCompleted={refresh} /><aside className="command-rail"><WorkerPanel workers={data?.workers || []} /><EventStream events={data?.events || []} /><HandoffQueue queue={data?.handoffs || []} onResolve={(id) => void resolveHandoff(id)} busyId={busyHandoff} /></aside></div>
  </div>;
}
