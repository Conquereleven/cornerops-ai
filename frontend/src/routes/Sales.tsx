import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { roleAllows } from '../auth/AuthBoundaries';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { modulePath } from '../config/moduleRegistry';
import { ApiError, SALES_STAGES, createSalesAccount, getSalesAccounts, getSalesSummary, type SalesAccountRow, type SalesSummary } from '../lib/api';

const day = (value: string | null | undefined) => (value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const money = (total: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(total);
export const fieldErrors = (error: unknown) => (error instanceof ApiError && error.status === 400 ? 'Some fields were not accepted. Check the values and try again.' : error instanceof ApiError && error.status === 403 ? 'Your role cannot make this change.' : 'The change could not be saved. Nothing was recorded.');

export function Sales() {
  const { workspace } = useAuth();
  const canWrite = roleAllows(workspace.active?.role, 'operator');
  const [summary, setSummary] = useState<SalesSummary>();
  const [accounts, setAccounts] = useState<SalesAccountRow[]>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextAccounts] = await Promise.all([getSalesSummary(), getSalesAccounts()]);
      setSummary(nextSummary); setAccounts(nextAccounts.accounts); setError('');
    } catch {
      setSummary(undefined); setAccounts(undefined);
      setError('Sales is not connected. No records are shown and none are substituted.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) || '').trim();
    setSaving(true); setFormError('');
    try {
      await createSalesAccount({
        name: text('name'), website: text('website'), segment: text('segment'), source: text('source'),
        priority: text('priority') || null, fitScore: text('fitScore') ? Number(text('fitScore')) : null, problemHypothesis: text('problemHypothesis'),
      });
      setAdding(false);
      await load();
    } catch (reason) { setFormError(fieldErrors(reason)); } finally { setSaving(false); }
  };

  return <div className="module-page sales-page">
    <header className="page-title"><div><span className="eyebrow">{workspace.active?.slug === 'cornerops-ai' ? 'Corner Tech AI' : workspace.active?.name ?? 'Corner Tech AI'} · Sales</span><h1>Sales</h1><p>Accounts, contacts, opportunities and activity. Records are internal: nothing here sends a message.</p></div><div className="module-header-actions">{canWrite && <button onClick={() => { setAdding((value) => !value); setFormError(''); }} aria-expanded={adding}><Plus size={14} />New account</button>}<button onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} />Refresh</button></div></header>

    {error && <section className="resource-error" role="alert"><div><strong>Not connected</strong><p>{error}</p></div><button onClick={() => void load()}>Retry</button></section>}

    {adding && <form className="panel sales-form" onSubmit={(event) => void submit(event)} aria-label="New account">
      <div className="form-grid">
        <label>Company<input name="name" required maxLength={200} autoFocus /></label>
        <label>Website<input name="website" maxLength={300} inputMode="url" /></label>
        <label>Segment<input name="segment" maxLength={80} /></label>
        <label>Source<input name="source" maxLength={80} /></label>
        <label>Priority<select name="priority" defaultValue=""><option value="">Not set</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label>Fit score (0–100)<input name="fitScore" type="number" min={0} max={100} step={1} /></label>
      </div>
      <label className="sales-wide">Problem hypothesis<textarea name="problemHypothesis" maxLength={2000} rows={3} /></label>
      {formError && <p className="form-notice sales-form-error" role="alert">{formError}</p>}
      <div className="button-row"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save account'}</button><button className="secondary-button" type="button" onClick={() => setAdding(false)}>Cancel</button></div>
    </form>}

    {summary && <>
      <section className="panel sales-pipeline" aria-labelledby="sales-pipeline-title"><div className="panel-heading"><div><span className="eyebrow">Pipeline</span><h2 id="sales-pipeline-title">Opportunities by stage</h2></div><span className="sales-value">{summary.pipelineValue.length ? summary.pipelineValue.map((item) => `${money(item.total, item.currency)} across ${item.opportunities}`).join(' · ') : 'No estimated values entered'}{summary.valueCoverage.withoutValue > 0 && summary.pipelineValue.length > 0 ? ` · ${summary.valueCoverage.withoutValue} without a value` : ''}</span></div>
        <ol className="sales-stages">{SALES_STAGES.map((stage) => <li key={stage} className={summary.opportunities.byStage[stage] ? 'sales-stage-active' : ''}><strong>{summary.opportunities.byStage[stage] ?? 0}</strong><span>{stage}</span></li>)}</ol>
      </section>
      <div className="overview-grid">
        <section className="panel overview-card" aria-labelledby="sales-due"><div className="panel-heading"><h2 id="sales-due">Next actions due</h2><StatusBadge tone={summary.nextActionsDue.length ? 'amber' : 'neutral'}>{summary.nextActionsDue.length}</StatusBadge></div>
          {summary.nextActionsDue.length ? <ul className="overview-list">{summary.nextActionsDue.map((item) => <li key={item.opportunityId}><Link to={`${modulePath('sales')}/accounts/${item.accountId}`}>{item.accountName ?? 'Account'}</Link> — {item.nextStep} <small>{day(item.nextStepAt)}</small></li>)}</ul> : <p className="sales-muted">Nothing is due.</p>}
        </section>
        <section className="panel overview-card" aria-labelledby="sales-follow"><div className="panel-heading"><h2 id="sales-follow">Needs a next step</h2><StatusBadge tone={summary.needingFollowUp.length ? 'amber' : 'neutral'}>{summary.needingFollowUp.length}</StatusBadge></div>
          {summary.needingFollowUp.length ? <ul className="overview-list">{summary.needingFollowUp.map((item) => <li key={item.opportunityId}><Link to={`${modulePath('sales')}/accounts/${item.accountId}`}>{item.accountName ?? 'Account'}</Link> — {item.stage}</li>)}</ul> : <p className="sales-muted">Every open opportunity has a next step and date.</p>}
        </section>
      </div>
    </>}

    {accounts && (accounts.length === 0 ? <section className="panel module-empty"><strong>No accounts yet</strong><p>{canWrite ? 'Record the first company you are talking to with “New account”.' : 'No accounts have been recorded in this workspace.'}</p></section> : <section className="panel" aria-labelledby="sales-accounts-title"><div className="panel-heading"><h2 id="sales-accounts-title">Accounts</h2><span className="sales-muted">{accounts.length}</span></div>
      <div className="table-wrap"><table><thead><tr><th scope="col">Company</th><th scope="col">Segment</th><th scope="col">Priority</th><th scope="col">Fit</th><th scope="col">Primary contact</th><th scope="col">Latest activity</th><th scope="col">Next step</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}>
        <td><Link className="cell-primary" to={`${modulePath('sales')}/accounts/${account.id}`}>{account.name}</Link></td>
        <td>{account.segment ?? '—'}</td>
        <td>{account.priority ? <StatusBadge tone={account.priority === 'high' ? 'red' : account.priority === 'medium' ? 'amber' : 'neutral'}>{account.priority}</StatusBadge> : '—'}</td>
        <td>{account.fitScore ?? '—'}</td>
        <td>{account.primaryContact ? <>{account.primaryContact.name}{account.primaryContact.title && <small> · {account.primaryContact.title}</small>}</> : '—'}</td>
        <td>{account.latestActivity ? <>{account.latestActivity.type} <small>{day(account.latestActivity.occurredAt)}</small></> : '—'}</td>
        <td>{account.nextStep ? <>{account.nextStep.text} <small>{day(account.nextStep.at)}</small></> : '—'}</td>
      </tr>)}</tbody></table></div>
    </section>)}
  </div>;
}
