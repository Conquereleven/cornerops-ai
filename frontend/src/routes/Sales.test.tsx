import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from '../App';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const session = { access_token: 'aaa.bbb.ccc', user: { id: USER_ID } };
const client = { auth: {
  getSession: async () => ({ data: { session }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  signOut: async () => ({ error: null }),
} } as unknown as SupabaseClient;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const byStage = { new: 0, contacted: 1, engaged: 0, discovery: 0, qualified: 0, proposal: 0, won: 0, lost: 0, nurture: 0 };
const summary = (overrides = {}) => ({ accounts: { total: 1 }, opportunities: { total: 1, open: 1, byStage }, nextActionsDue: [{ opportunityId: 'o1', accountId: 'a1', accountName: 'Example Trading LLC', stage: 'contacted', nextStep: 'Send discovery questions', nextStepAt: '2020-01-02T09:00:00Z' }], needingFollowUp: [], pipelineValue: [], valueCoverage: { withValue: 0, withoutValue: 1 }, ...overrides });
const emptySummary = summary({ accounts: { total: 0 }, opportunities: { total: 0, open: 0, byStage: { ...byStage, contacted: 0 } }, nextActionsDue: [], valueCoverage: { withValue: 0, withoutValue: 0 } });
const account = { id: 'a1', name: 'Example Trading LLC', website: null, segment: 'Distribution', source: 'Referral', priority: 'high', fitScore: 80, status: 'prospect', problemHypothesis: 'Manual order intake', updatedAt: '2020-01-01T00:00:00Z' };
const row = { ...account, primaryContact: { id: 'c1', name: 'Ana Ejemplo', title: 'Operations' }, latestActivity: { type: 'email', occurredAt: '2020-01-01T00:00:00Z', outcome: 'Intro sent' }, nextStep: { text: 'Send discovery questions', at: '2020-01-02T09:00:00Z', stage: 'contacted' }, openOpportunities: 1 };
const detail = { account, contacts: [{ id: 'c1', name: 'Ana Ejemplo', title: 'Operations', email: 'ana@example.test', phone: null, linkedinUrl: 'javascript:alert(1)', contactConfidence: 'likely', isPrimary: true }], opportunities: [{ id: 'o1', stage: 'contacted', problemSummary: null, solutionHypothesis: null, currency: null, estimatedValue: null, qualificationScore: null, nextStep: 'Send discovery questions', nextStepAt: '2020-01-02T09:00:00Z' }], activities: [{ id: 'x1', type: 'email', direction: 'outbound', occurredAt: '2020-01-01T00:00:00Z', outcome: 'Intro sent', notes: null, externalRef: 'gmail-thread:abc', contactId: 'c1', opportunityId: 'o1' }] };

type Call = { url: string; method: string; body: unknown };
const setup = (role: 'viewer' | 'operator', path: string, options: { summary?: unknown; accounts?: unknown[]; failWrites?: number } = {}) => {
  const calls: Call[] = [];
  window.history.pushState({}, '', path);
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input); const method = init?.method ?? 'GET';
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url.includes('/api/app/session')) return json({ authenticated: true, user: { id: USER_ID }, workspaces: [{ id: 'w1', slug: 'cornerops-ai', name: 'CornerOps AI', role }] });
    if (method !== 'GET') return options.failWrites ? json({ error: true, code: 'SALES_VALIDATION_FAILED', fields: { name: 'is required' } }, options.failWrites) : json({ id: 'new' }, 201);
    if (url.includes('/api/app/sales/summary')) return json(options.summary ?? summary());
    if (url.includes('/api/app/sales/accounts/a1')) return json(detail);
    if (url.includes('/api/app/sales/accounts/')) return json({ error: true, message: 'Account not found.' }, 404);
    if (url.includes('/api/app/sales/accounts')) return json({ accounts: options.accounts ?? [row] });
    if (url.endsWith('/health')) return json({ status: 'ok', service: 'cornerops-ai', dataSource: { mode: 'supabase' } });
    return json({ error: true }, 503);
  });
  render(<App authClient={client} />);
  return calls;
};

afterEach(() => { vi.restoreAllMocks(); window.history.pushState({}, '', '/'); });

describe('Sales', () => {
  test('empty state is clean and offers the first step to an operator', async () => {
    setup('operator', '/app/sales', { summary: emptySummary, accounts: [] });
    expect(await screen.findByText('No accounts yet')).toBeInTheDocument();
    expect(screen.getByText('No estimated values entered')).toBeInTheDocument();
    expect(screen.getByText('Nothing is due.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New account' })).toBeInTheDocument();
  });

  test('lists accounts with contact, latest activity and next step, and no invented value', async () => {
    setup('operator', '/app/sales');
    const table = within(await screen.findByRole('table'));
    expect(table.getByRole('link', { name: 'Example Trading LLC' })).toHaveAttribute('href', '/app/sales/accounts/a1');
    ['Company', 'Segment', 'Priority', 'Fit', 'Primary contact', 'Latest activity', 'Next step'].forEach((name) => expect(table.getByRole('columnheader', { name })).toBeInTheDocument());
    expect(table.getByText('Ana Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('No estimated values entered')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[$€]|AED\s?\d/);
  });

  test('shows entered pipeline value by currency and how many have none', async () => {
    setup('operator', '/app/sales', { summary: summary({ pipelineValue: [{ currency: 'AED', total: 12000, opportunities: 1 }], valueCoverage: { withValue: 1, withoutValue: 2 } }) });
    expect(await screen.findByText(/12,000.*across 1.*2 without a value/)).toBeInTheDocument();
  });

  test('operator records a new account', async () => {
    const calls = setup('operator', '/app/sales', { summary: emptySummary, accounts: [] });
    await userEvent.click(await screen.findByRole('button', { name: 'New account' }));
    const form = within(screen.getByRole('form', { name: 'New account' }));
    await userEvent.type(form.getByLabelText('Company'), 'Second Example Co');
    await userEvent.selectOptions(form.getByLabelText('Priority'), 'high');
    await userEvent.type(form.getByLabelText('Fit score (0–100)'), '70');
    await userEvent.click(form.getByRole('button', { name: 'Save account' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'POST')).toBe(true));
    const post = calls.find((call) => call.method === 'POST') as Call;
    expect(post.url).toContain('/api/app/sales/accounts');
    expect(post.body).toMatchObject({ name: 'Second Example Co', priority: 'high', fitScore: 70 });
    expect(Object.keys(post.body as object)).not.toContain('workspaceId');
    await waitFor(() => expect(screen.queryByRole('form', { name: 'New account' })).not.toBeInTheDocument());
  });

  test('a rejected save says so and keeps the form open', async () => {
    setup('operator', '/app/sales', { summary: emptySummary, accounts: [], failWrites: 400 });
    await userEvent.click(await screen.findByRole('button', { name: 'New account' }));
    await userEvent.type(screen.getByLabelText('Company'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Save account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Some fields were not accepted');
    expect(screen.getByRole('form', { name: 'New account' })).toBeInTheDocument();
  });

  test('viewer can read but is offered no write controls', async () => {
    setup('viewer', '/app/sales/accounts/a1');
    expect(await screen.findByRole('heading', { name: 'Example Trading LLC' })).toBeInTheDocument();
    ['New account', 'Edit account', 'Add contact', 'Add opportunity', 'Log activity', 'Update stage or next step'].forEach((name) => expect(screen.queryByRole('button', { name })).not.toBeInTheDocument());
  });

  test('account detail shows facts, contacts, opportunities and the timeline', async () => {
    setup('operator', '/app/sales/accounts/a1');
    expect(await screen.findByRole('heading', { name: 'Example Trading LLC' })).toBeInTheDocument();
    expect(screen.getByText('Manual order intake')).toBeInTheDocument();
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('No value entered')).toBeInTheDocument();
    expect(screen.getByText('Intro sent')).toBeInTheDocument();
    expect(screen.getByText(/It does not send anything/)).toBeInTheDocument();
    // An unsafe stored URL is never rendered as a link.
    expect(screen.queryByRole('link', { name: 'LinkedIn profile' })).not.toBeInTheDocument();
  });

  test('logging an activity only writes an internal record', async () => {
    const calls = setup('operator', '/app/sales/accounts/a1');
    await userEvent.click(await screen.findByRole('button', { name: 'Log activity' }));
    const form = within(screen.getByRole('form', { name: 'Log activity' }));
    await userEvent.selectOptions(form.getByLabelText('Type'), 'whatsapp');
    await userEvent.type(form.getByLabelText('Outcome'), 'Replied');
    await userEvent.click(form.getByRole('button', { name: 'Log activity' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'POST')).toBe(true));
    const writes = calls.filter((call) => call.method !== 'GET');
    expect(writes).toHaveLength(1);
    expect(writes[0].url).toMatch(/\/api\/app\/sales\/accounts\/a1\/activities$/);
    expect(writes[0].body).toMatchObject({ type: 'whatsapp', outcome: 'Replied' });
    expect(calls.every((call) => !/wa\.me|whatsapp\.com|gmail|linkedin\.com|graph\.facebook/.test(call.url))).toBe(true);
  });

  test('updating the next step patches the opportunity', async () => {
    const calls = setup('operator', '/app/sales/accounts/a1');
    await userEvent.click(await screen.findByRole('button', { name: 'Update stage or next step' }));
    const form = within(screen.getByRole('form', { name: 'Update stage or next step' }));
    await userEvent.selectOptions(form.getByLabelText('Stage'), 'engaged');
    await userEvent.clear(form.getByLabelText('Next step'));
    await userEvent.type(form.getByLabelText('Next step'), 'Book discovery call');
    await userEvent.click(form.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH') as Call;
    expect(patch.url).toMatch(/\/api\/app\/sales\/opportunities\/o1$/);
    expect(patch.body).toMatchObject({ stage: 'engaged', nextStep: 'Book discovery call' });
  });

  test('an account from another workspace is simply not found', async () => {
    setup('operator', '/app/sales/accounts/other');
    expect(await screen.findByText('Account not found')).toBeInTheDocument();
  });

  test('when sales is unavailable it says so and shows no records', async () => {
    window.history.pushState({}, '', '/app/sales');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => (String(input).includes('/api/app/session')
      ? json({ authenticated: true, user: { id: USER_ID }, workspaces: [{ id: 'w1', slug: 'cornerops-ai', name: 'CornerOps AI', role: 'operator' }] })
      : json({ error: true }, 503)));
    render(<App authClient={client} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Sales is not connected');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
