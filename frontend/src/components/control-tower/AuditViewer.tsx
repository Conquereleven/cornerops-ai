import { useState } from 'react';
import type { ControlTowerAuditEvent } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

const filters = ['all', 'denied', 'errors', 'approvals', 'telegram'] as const;

export function AuditViewer({ events }: { events: ControlTowerAuditEvent[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');
  const visible = events.filter((event) => {
    if (filter === 'all') return true;
    if (filter === 'denied') return event.status === 'denied' || event.policyDecision === 'denied';
    if (filter === 'errors') return event.status === 'error';
    if (filter === 'approvals') return event.eventType.includes('approval');
    return event.channel === 'telegram';
  });
  return <section className="panel ct-panel ct-wide">
    <div className="panel-heading"><div><span className="eyebrow">Sanitized evidence</span><h2>Audit Viewer</h2></div><label className="ct-filter">Filter<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>{filters.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="table-wrap"><table className="ct-table"><thead><tr><th>Timestamp</th><th>Event</th><th>Source</th><th>Decision</th><th>Status</th><th>Sanitized preview</th></tr></thead><tbody>
      {visible.length ? visible.map((event) => <tr key={`${event.auditId}-${event.timestamp}`}>
        <td>{event.timestamp ? new Date(event.timestamp).toLocaleString() : 'unknown'}</td>
        <td><strong className="cell-primary">{event.eventType}</strong><small>{event.auditId}</small></td>
        <td>{event.source} · {event.channel}</td>
        <td>{event.policyDecision}</td>
        <td><StatusBadge tone={event.status === 'denied' || event.status === 'error' ? 'red' : 'green'}>{event.status}</StatusBadge></td>
        <td><code className="ct-preview">{event.preview}</code></td>
      </tr>) : <tr><td className="empty-cell" colSpan={6}>No events match this filter.</td></tr>}
    </tbody></table></div>
  </section>;
}
