import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { modulePath } from '../config/moduleRegistry';
import { getSalesSummary, getWorkQueueStatus, type SalesSummary, type WorkQueueStatus } from '../lib/api';
import { useHealth } from '../hooks/useHealth';

type Loaded<T> = { state: 'loading' } | { state: 'ready'; data: T } | { state: 'unavailable' };
const settle = <T,>(result: PromiseSettledResult<T>): Loaded<T> => (result.status === 'fulfilled' ? { state: 'ready', data: result.value } : { state: 'unavailable' });
const date = (value: string | null) => (value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date');

function Unavailable({ what }: { what: string }) {
  return <div className="module-empty"><strong>Not connected</strong><p>{what} could not be loaded. No substitute numbers are shown.</p></div>;
}

// Company-level overview for CornerTech AI. Every figure comes from a live
// internal source; anything not connected says so instead of showing a number.
export function CompanyOverview() {
  const { workspace } = useAuth();
  const { connected } = useHealth();
  const [sales, setSales] = useState<Loaded<SalesSummary>>({ state: 'loading' });
  const [queue, setQueue] = useState<Loaded<WorkQueueStatus>>({ state: 'loading' });
  const load = useCallback(async () => {
    setSales({ state: 'loading' }); setQueue({ state: 'loading' });
    const [salesResult, queueResult] = await Promise.allSettled([getSalesSummary(), getWorkQueueStatus()]);
    setSales(settle(salesResult)); setQueue(settle(queueResult));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const loading = sales.state === 'loading' || queue.state === 'loading';
  const queueReady = queue.state === 'ready' && queue.data.status === 'ready';
  const due = sales.state === 'ready' ? sales.data.nextActionsDue : [];
  const followUp = sales.state === 'ready' ? sales.data.needingFollowUp : [];
  const pending = queueReady ? queue.data.metrics.pendingApprovals : 0;
  const nothingToday = sales.state === 'ready' && queueReady && !due.length && !followUp.length && !pending;

  return <div className="dashboard-page">
    <header className="page-title"><div><span className="eyebrow">{workspace.active?.slug === 'cornerops-ai' ? 'CornerTech AI' : workspace.active?.name ?? 'CornerTech AI'} · Company workspace</span><h1>Overview</h1><p>What needs attention across CornerTech AI today.</p></div><div className="module-header-actions"><button onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} />Refresh</button></div></header>

    <section className="panel overview-summary" aria-labelledby="founder-today"><div className="panel-heading"><div><span className="eyebrow">Founder today</span><h2 id="founder-today">Needs attention</h2></div></div>
      {loading ? <p role="status">Loading…</p> : nothingToday ? <div className="module-empty"><strong>Nothing is due</strong><p>No sales follow-ups are due and no approvals are waiting.</p></div> : <ul className="overview-list">
        {sales.state === 'ready' ? <>
          <li><Link to={modulePath('sales')}><strong>{due.length}</strong> sales next {due.length === 1 ? 'step is' : 'steps are'} due</Link></li>
          <li><Link to={modulePath('sales')}><strong>{followUp.length}</strong> open {followUp.length === 1 ? 'opportunity has' : 'opportunities have'} no next step or date</Link></li>
        </> : <li>Sales is not connected.</li>}
        {queueReady ? <li><Link to={modulePath('approvals')}><strong>{pending}</strong> {pending === 1 ? 'approval is' : 'approvals are'} waiting</Link></li> : <li>Approvals are not connected.</li>}
      </ul>}
    </section>

    <div className="overview-grid">
      <section className="panel overview-card" aria-labelledby="overview-sales"><div className="panel-heading"><h2 id="overview-sales">Sales pipeline</h2><Link to={modulePath('sales')}>Open Sales</Link></div>
        {sales.state === 'loading' ? <p role="status">Loading…</p> : sales.state === 'unavailable' ? <Unavailable what="Sales" /> : sales.data.accounts.total === 0 ? <div className="module-empty"><strong>No records</strong><p>No accounts have been recorded yet.</p></div> : <>
          <dl className="overview-facts"><div><dt>Accounts</dt><dd>{sales.data.accounts.total}</dd></div><div><dt>Open opportunities</dt><dd>{sales.data.opportunities.open}</dd></div><div><dt>Next steps due</dt><dd>{due.length}</dd></div></dl>
          {due.length > 0 && <ul className="overview-list">{due.slice(0, 5).map((item) => <li key={item.opportunityId}><Link to={`${modulePath('sales')}/accounts/${item.accountId}`}>{item.accountName ?? 'Account'}</Link> — {item.nextStep} <small>{date(item.nextStepAt)}</small></li>)}</ul>}
        </>}
      </section>

      <section className="panel overview-card" aria-labelledby="overview-queue"><div className="panel-heading"><h2 id="overview-queue">Work queue and approvals</h2><Link to={modulePath('work-queue')}>Open Work Queue</Link></div>
        {queue.state === 'loading' ? <p role="status">Loading…</p> : !queueReady ? <Unavailable what="The work queue" /> : <dl className="overview-facts"><div><dt>Open items</dt><dd>{queue.data.metrics.openWorkItems}</dd></div><div><dt>High priority</dt><dd>{queue.data.metrics.highPriorityWorkItems}</dd></div><div><dt>Pending approvals</dt><dd>{queue.data.metrics.pendingApprovals}</dd></div></dl>}
      </section>

      <section className="panel overview-card" aria-labelledby="overview-risks"><div className="panel-heading"><h2 id="overview-risks">Risks and blockers</h2></div>
        {!queueReady ? <Unavailable what="Risk signals" /> : queue.data.metrics.highPriorityWorkItems === 0 ? <div className="module-empty"><strong>No records</strong><p>No high-priority work items are open.</p></div> : <p><Link to={modulePath('work-queue')}>{queue.data.metrics.highPriorityWorkItems} high-priority work {queue.data.metrics.highPriorityWorkItems === 1 ? 'item is' : 'items are'} open</Link></p>}
      </section>

      <section className="panel overview-card" aria-labelledby="overview-system"><div className="panel-heading"><h2 id="overview-system">System health</h2><StatusBadge tone={connected ? 'green' : 'red'}>{connected ? 'API reachable' : 'API unreachable'}</StatusBadge></div>
        <p>Internal persistence: <strong>{queue.state === 'loading' ? 'checking…' : queueReady ? 'connected' : 'not connected'}</strong></p>
        <p><Link to={modulePath('control-tower')}>Control Tower</Link> · <Link to={modulePath('audit-log')}>Audit</Link></p>
      </section>

      <section className="panel overview-card" aria-labelledby="overview-incubator"><div className="panel-heading"><h2 id="overview-incubator">Products and incubators</h2><StatusBadge tone="blue">Incubator</StatusBadge></div>
        <p>Commerce OS, including the CornerMex validation data, lives in its own area and is not part of these company figures.</p>
        <p><Link to={modulePath('commerce-overview')}>Open Commerce OS</Link></p>
      </section>
    </div>
  </div>;
}
