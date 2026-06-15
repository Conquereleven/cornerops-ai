import { Bot, Box, CircleDollarSign, MessageSquare, Users } from 'lucide-react';
import type { OperationEvent } from '../../lib/types';
import { formatTime } from '../../lib/format';

const icons = {
  worker_run: Bot,
  conversation: MessageSquare,
  product_search: CircleDollarSign,
  order_status: Box,
  b2b_lead: Users,
  human_handoff: Users,
  support: MessageSquare,
};

export function EventStream({ events }: { events: OperationEvent[] }) {
  return <section className="panel event-panel"><div className="panel-heading"><div><span className="eyebrow">Live telemetry</span><h2>Stream de eventos</h2></div><span className="live-label"><i /> En vivo</span></div><div className="event-list">{events.map((event) => {
    const Icon = icons[event.type as keyof typeof icons] || Bot;
    return <div className="event-row" key={event.id}><span className={`event-icon event-${event.tone}`}><Icon size={14} /></span><time>{formatTime(event.createdAt)}</time><p>{event.message}</p></div>;
  })}</div></section>;
}
