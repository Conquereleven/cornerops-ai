import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { roleAllows } from '../auth/AuthBoundaries';
import { useAuth } from '../auth/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { modulePath } from '../config/moduleRegistry';
import { ApiError, SALES_ACTIVITY_TYPES, SALES_STAGES, createSalesActivity, createSalesContact, createSalesOpportunity, getSalesAccount, updateSalesAccount, updateSalesOpportunity, type SalesAccountDetail, type SalesOpportunity } from '../lib/api';
import { fieldErrors } from './Sales';

const when = (value: string | null) => (value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const dateInput = (value: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const isoDate = (value: string) => (value ? new Date(`${value}T09:00:00`).toISOString() : null);
const values = (form: HTMLFormElement) => { const data = new FormData(form); return (name: string) => String(data.get(name) || '').trim(); };

// One inline form: collapsed behind a button, reports failure in place.
function InlineForm({ label, submitLabel, onSubmit, children }: { label: string; submitLabel: string; onSubmit: (read: (name: string) => string) => Promise<void>; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true); setError('');
    try { await onSubmit(values(form)); form.reset(); setOpen(false); }
    catch (reason) { setError(fieldErrors(reason)); }
    finally { setSaving(false); }
  };
  if (!open) return <button className="secondary-button" type="button" onClick={() => setOpen(true)}>{label}</button>;
  return <form className="sales-form sales-inline-form" onSubmit={(event) => void submit(event)} aria-label={label}>{children}{error && <p className="form-notice sales-form-error" role="alert">{error}</p>}<div className="button-row"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button><button className="secondary-button" type="button" onClick={() => setOpen(false)}>Cancel</button></div></form>;
}

function OpportunityRow({ opportunity, canWrite, onSaved }: { opportunity: SalesOpportunity; canWrite: boolean; onSaved: () => Promise<void> }) {
  const value = opportunity.estimatedValue !== null && opportunity.currency ? new Intl.NumberFormat(undefined, { style: 'currency', currency: opportunity.currency, maximumFractionDigits: 0 }).format(opportunity.estimatedValue) : 'No value entered';
  return <li className="sales-record"><div><StatusBadge tone={opportunity.stage === 'won' ? 'green' : opportunity.stage === 'lost' ? 'red' : 'blue'}>{opportunity.stage}</StatusBadge> <span className="sales-muted">{value}</span></div>
    {opportunity.problemSummary && <p>{opportunity.problemSummary}</p>}
    <p><strong>Next step:</strong> {opportunity.nextStep ?? 'Not set'} <small>{opportunity.nextStepAt ? when(opportunity.nextStepAt) : ''}</small></p>
    {canWrite && <InlineForm label="Update stage or next step" submitLabel="Save" onSubmit={async (read) => { await updateSalesOpportunity(opportunity.id, { stage: read('stage'), nextStep: read('nextStep'), nextStepAt: isoDate(read('nextStepAt')) }); await onSaved(); }}>
      <div className="form-grid"><label>Stage<select name="stage" defaultValue={opportunity.stage}>{SALES_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label><label>Next step date<input name="nextStepAt" type="date" defaultValue={dateInput(opportunity.nextStepAt)} /></label></div>
      <label className="sales-wide">Next step<input name="nextStep" maxLength={500} defaultValue={opportunity.nextStep ?? ''} /></label>
    </InlineForm>}
  </li>;
}

export function SalesAccount() {
  const { accountId = '' } = useParams();
  const { workspace } = useAuth();
  const canWrite = roleAllows(workspace.active?.role, 'operator');
  const [detail, setDetail] = useState<SalesAccountDetail>();
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'unavailable'>('loading');

  const load = useCallback(async () => {
    try { setDetail(await getSalesAccount(accountId)); setState('ready'); }
    catch (reason) { setDetail(undefined); setState(reason instanceof ApiError && reason.status === 404 ? 'missing' : 'unavailable'); }
  }, [accountId]);
  useEffect(() => { setState('loading'); void load(); }, [load]);

  const back = <Link className="sales-back" to={modulePath('sales')}><ArrowLeft size={14} /> All accounts</Link>;
  if (state === 'loading') return <div className="module-page">{back}<p role="status">Loading account…</p></div>;
  if (state === 'missing') return <div className="module-page">{back}<section className="panel module-empty"><strong>Account not found</strong><p>It does not exist in this workspace.</p></section></div>;
  if (state === 'unavailable' || !detail) return <div className="module-page">{back}<section className="resource-error" role="alert"><div><strong>Not connected</strong><p>The account could not be loaded. Nothing is substituted.</p></div><button onClick={() => void load()}>Retry</button></section></div>;

  const { account, contacts, opportunities, activities } = detail;
  const contactName = (id: string | null) => contacts.find((contact) => contact.id === id)?.name;

  return <div className="module-page sales-page">
    {back}
    <header className="page-title"><div><span className="eyebrow">{workspace.active?.slug === 'cornerops-ai' ? 'Corner Tech AI' : workspace.active?.name ?? 'Corner Tech AI'} · Sales account</span><h1>{account.name}</h1><p>{[account.segment, account.source && `Source: ${account.source}`].filter(Boolean).join(' · ') || 'No segment or source recorded.'}</p></div><div className="module-header-actions"><StatusBadge tone="blue">{account.status}</StatusBadge>{account.priority && <StatusBadge tone={account.priority === 'high' ? 'red' : 'amber'}>{account.priority} priority</StatusBadge>}</div></header>

    <div className="overview-grid">
      <section className="panel overview-card" aria-labelledby="account-facts"><div className="panel-heading"><h2 id="account-facts">Account</h2></div>
        <dl className="overview-facts"><div><dt>Fit score</dt><dd>{account.fitScore ?? '—'}</dd></div><div><dt>Website</dt><dd>{account.website ?? '—'}</dd></div><div><dt>Updated</dt><dd>{when(account.updatedAt)}</dd></div></dl>
        <h3>Problem hypothesis</h3><p>{account.problemHypothesis ?? 'Not recorded.'}</p>
        {canWrite && <InlineForm label="Edit account" submitLabel="Save" onSubmit={async (read) => { await updateSalesAccount(account.id, { status: read('status'), priority: read('priority') || null, fitScore: read('fitScore') ? Number(read('fitScore')) : null, problemHypothesis: read('problemHypothesis') }); await load(); }}>
          <div className="form-grid"><label>Status<select name="status" defaultValue={account.status}>{['prospect', 'active', 'customer', 'disqualified', 'archived'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label>Priority<select name="priority" defaultValue={account.priority ?? ''}><option value="">Not set</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Fit score (0–100)<input name="fitScore" type="number" min={0} max={100} defaultValue={account.fitScore ?? ''} /></label></div>
          <label className="sales-wide">Problem hypothesis<textarea name="problemHypothesis" rows={3} maxLength={2000} defaultValue={account.problemHypothesis ?? ''} /></label>
        </InlineForm>}
      </section>

      <section className="panel overview-card" aria-labelledby="account-contacts"><div className="panel-heading"><h2 id="account-contacts">Contacts</h2><span className="sales-muted">{contacts.length}</span></div>
        {contacts.length ? <ul className="sales-records">{contacts.map((contact) => <li className="sales-record" key={contact.id}><div><strong>{contact.name}</strong>{contact.isPrimary && <> <StatusBadge tone="green">primary</StatusBadge></>}</div><p>{[contact.title, contact.email, contact.phone].filter(Boolean).join(' · ') || 'No details recorded.'}</p>{contact.linkedinUrl && /^https:\/\//.test(contact.linkedinUrl) && <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn profile</a>}</li>)}</ul> : <p className="sales-muted">No contacts recorded.</p>}
        {canWrite && <InlineForm label="Add contact" submitLabel="Save contact" onSubmit={async (read) => { await createSalesContact(account.id, { name: read('name'), title: read('title'), email: read('email'), phone: read('phone'), linkedinUrl: read('linkedinUrl'), isPrimary: read('isPrimary') === 'on' }); await load(); }}>
          <div className="form-grid"><label>Name<input name="name" required maxLength={200} /></label><label>Title<input name="title" maxLength={160} /></label><label>Email<input name="email" type="email" maxLength={320} autoComplete="off" /></label><label>Phone<input name="phone" maxLength={40} autoComplete="off" /></label><label>LinkedIn URL<input name="linkedinUrl" maxLength={300} inputMode="url" /></label><label className="setting-check"><input name="isPrimary" type="checkbox" /> Primary contact</label></div>
        </InlineForm>}
      </section>
    </div>

    <section className="panel overview-card" aria-labelledby="account-opportunities"><div className="panel-heading"><h2 id="account-opportunities">Opportunities</h2><span className="sales-muted">{opportunities.length}</span></div>
      {opportunities.length ? <ul className="sales-records">{opportunities.map((opportunity) => <OpportunityRow key={opportunity.id} opportunity={opportunity} canWrite={canWrite} onSaved={load} />)}</ul> : <p className="sales-muted">No opportunities recorded.</p>}
      {canWrite && <InlineForm label="Add opportunity" submitLabel="Save opportunity" onSubmit={async (read) => { await createSalesOpportunity(account.id, { stage: read('stage'), problemSummary: read('problemSummary'), nextStep: read('nextStep'), nextStepAt: isoDate(read('nextStepAt')), estimatedValue: read('estimatedValue') ? Number(read('estimatedValue')) : null, currency: read('estimatedValue') ? read('currency').toUpperCase() : null }); await load(); }}>
        <div className="form-grid"><label>Stage<select name="stage" defaultValue="new">{SALES_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label><label>Next step date<input name="nextStepAt" type="date" /></label><label>Estimated value (optional)<input name="estimatedValue" type="number" min={0} step="0.01" /></label><label>Currency (3 letters)<input name="currency" maxLength={3} pattern="[A-Za-z]{3}" placeholder="AED" /></label></div>
        <label className="sales-wide">Problem summary<textarea name="problemSummary" rows={2} maxLength={2000} /></label>
        <label className="sales-wide">Next step<input name="nextStep" maxLength={500} /></label>
      </InlineForm>}
    </section>

    <section className="panel overview-card" aria-labelledby="account-activity"><div className="panel-heading"><div><h2 id="account-activity">Activity timeline</h2><p className="sales-muted">Logging an activity records what happened. It does not send anything.</p></div><span className="sales-muted">{activities.length}</span></div>
      {canWrite && <InlineForm label="Log activity" submitLabel="Log activity" onSubmit={async (read) => { await createSalesActivity(account.id, { type: read('type'), direction: read('direction'), occurredAt: isoDate(read('occurredAt')) ?? undefined, outcome: read('outcome'), notes: read('notes'), contactId: read('contactId') || null, opportunityId: read('opportunityId') || null }); await load(); }}>
        <div className="form-grid"><label>Type<select name="type" defaultValue="note">{SALES_ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>Direction<select name="direction" defaultValue="internal"><option value="internal">internal</option><option value="outbound">outbound</option><option value="inbound">inbound</option></select></label><label>Date<input name="occurredAt" type="date" /></label><label>Outcome<input name="outcome" maxLength={200} /></label><label>Contact<select name="contactId" defaultValue=""><option value="">None</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label><label>Opportunity<select name="opportunityId" defaultValue=""><option value="">None</option>{opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.stage}{opportunity.nextStep ? ` · ${opportunity.nextStep}` : ''}</option>)}</select></label></div>
        <label className="sales-wide">Notes<textarea name="notes" rows={3} maxLength={5000} /></label>
      </InlineForm>}
      {activities.length ? <ol className="sales-timeline">{activities.map((activity) => <li key={activity.id}><div><StatusBadge tone="neutral">{activity.type}</StatusBadge> <span className="sales-muted">{activity.direction} · {when(activity.occurredAt)}{contactName(activity.contactId) ? ` · ${contactName(activity.contactId)}` : ''}</span></div>{activity.outcome && <p><strong>{activity.outcome}</strong></p>}{activity.notes && <p>{activity.notes}</p>}</li>)}</ol> : <p className="sales-muted">No activity recorded.</p>}
    </section>
  </div>;
}
