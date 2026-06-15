import type { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, change, icon: Icon, tone = 'green' }: { label: string; value: string; change: string; icon: LucideIcon; tone?: 'green' | 'blue' | 'amber' }) {
  return <article className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={17} /></div><span>{label}</span><strong>{value}</strong><small>{change}</small></article>;
}
