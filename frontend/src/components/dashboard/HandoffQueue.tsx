import { Clock3, UserRoundCheck } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import type { Handoff } from '../../lib/types';
import { formatDuration } from '../../lib/format';

export function HandoffQueue({ queue, onResolve, busyId }: { queue: Handoff[]; onResolve: (id: string) => void; busyId?: string }) {
  return (
    <section className="panel handoff-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Human operations</span><h2>Cola / Handoff</h2></div>
        <StatusBadge tone="amber">En espera: {queue.length}</StatusBadge>
      </div>
      <div className="queue-list">
        {queue.slice(0, 4).map((item) => (
          <div className="queue-row" key={item.id}>
            <span className="event-icon event-amber"><UserRoundCheck size={14} /></span>
            <div><strong>{item.reason}</strong><small>{item.conversationId}</small></div>
            <span className="queue-time"><Clock3 size={12} /> {formatDuration(item.waitSeconds)}</span>
            <button className={`queue-action priority-${item.priority}`} disabled={busyId === item.id} onClick={() => onResolve(item.id)}>{busyId === item.id ? '…' : 'Resolver'}</button>
          </div>
        ))}
        {!queue.length && <div className="queue-empty">No hay handoffs pendientes.</div>}
      </div>
    </section>
  );
}
