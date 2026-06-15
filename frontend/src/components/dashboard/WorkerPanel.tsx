import { Bot, Headphones, PackageSearch, Phone, ShoppingBag, Users } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import type { WorkerConfig } from '../../lib/types';
import { formatRelativeTime } from '../../lib/format';

const icons = {
  ordersWorker: PackageSearch,
  salesWorker: ShoppingBag,
  b2bWorker: Users,
  supportWorker: Headphones,
  humanHandoffWorker: Bot,
  ivrWorker: Phone,
};

export function WorkerPanel({ workers }: { workers: WorkerConfig[] }) {
  const active = workers.filter((worker) => worker.status === 'active').length;
  return <section className="panel worker-panel"><div className="panel-heading"><div><span className="eyebrow">Infrastructure</span><h2>Salud de Workers</h2></div><StatusBadge>{active} / {workers.length} activos</StatusBadge></div><div className="worker-list">{workers.map((worker) => {
    const Icon = icons[worker.id] || Bot;
    const tone = worker.status === 'active' ? 'green' : worker.status === 'placeholder' ? 'amber' : 'neutral';
    return <div className="worker-row" key={worker.id}><span className={`worker-orb ${worker.status !== 'active' ? 'worker-muted' : ''}`}><Icon size={16} /></span><div><strong>{worker.id}</strong><small>{worker.interactions} · {formatRelativeTime(worker.lastActivity)}</small></div><StatusBadge tone={tone}>{worker.status}</StatusBadge><time>{worker.latencyMs ? `${worker.latencyMs} ms` : '—'}</time></div>;
  })}</div></section>;
}
