import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from './App';

type Role = 'viewer' | 'operator' | 'founder';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const session = { access_token: 'aaa.bbb.ccc', user: { id: USER_ID } };
const membership = (role: Role) => ({ authenticated: true, user: { id: USER_ID }, workspaces: [{ id: 'w1', slug: 'cornerops-ai', name: 'CornerOps AI', role }] });
const emptySummary = { accounts: { total: 0 }, opportunities: { total: 0, open: 0, byStage: {} }, nextActionsDue: [], needingFollowUp: [], pipelineValue: [], valueCoverage: { withValue: 0, withoutValue: 0 } };

const fakeClient = (current: typeof session | null = session) => {
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: current }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signOut: vi.fn(async () => ({ error: null })),
    signInWithOtp: vi.fn(async () => ({ error: null })),
    signInWithOAuth: vi.fn(async () => ({ error: null })),
    exchangeCodeForSession: vi.fn(async () => ({ data: { session }, error: null })),
  };
  return { client: { auth } as unknown as SupabaseClient, auth };
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
// Routes backend calls. Anything not listed answers 503 so pages show their
// truthful "not connected" state instead of invented data.
const mockApi = (routes: Record<string, () => Response | Promise<Response>>) => vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
  const url = String(input);
  const match = Object.keys(routes).find((key) => url.includes(key));
  if (match) return routes[match]();
  if (url.endsWith('/health')) return json({ status: 'ok', service: 'cornerops-ai', dataSource: { mode: 'supabase' } });
  return json({ error: true, message: 'unavailable' }, 503);
});
const at = (path: string) => window.history.pushState({}, '', path);
const shell = () => screen.queryByRole('navigation', { name: 'Workspace navigation' });
const originalMatchMedia = window.matchMedia;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia });
  sessionStorage.clear();
  at('/');
});

describe('public surface', () => {
  test('renders the landing at root without calling any API', async () => {
    const fetchSpy = mockApi({});
    render(<App authClient={null} />);
    expect(await screen.findByRole('heading', { name: 'AI systems that make businesses run better.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Talk to CornerOps/ })).toHaveAttribute('href', '#contact');
    expect(document.getElementById('contact')).toBeInTheDocument();
    expect(document.getElementById('work')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api'))).toEqual([]);
    expect(shell()).not.toBeInTheDocument();
  });

  test('the landing is the same for a signed-in member: root never becomes the app', async () => {
    mockApi({ '/api/app/session': () => json(membership('founder')) });
    render(<App authClient={fakeClient().client} />);
    expect(await screen.findByRole('heading', { name: 'AI systems that make businesses run better.' })).toBeInTheDocument();
    expect(shell()).not.toBeInTheDocument();
  });

  test('external contact links open safely', async () => {
    render(<App authClient={null} />);
    await screen.findByRole('heading', { name: 'AI systems that make businesses run better.' });
    const external = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'));
    expect(external.length).toBeGreaterThan(0);
    external.forEach((link) => { expect(link.rel).toContain('noopener'); expect(link.rel).toContain('noreferrer'); expect(link.href).toMatch(/^https:/); });
    expect(screen.queryByRole('link', { name: 'Privacy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Terms' })).not.toBeInTheDocument();
  });

  test('keeps the landing static when reduced motion is requested', async () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: vi.fn().mockReturnValue({ matches: true, media: '(prefers-reduced-motion: reduce)', addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
    const { container } = render(<App authClient={null} />);
    await waitFor(() => expect(container.querySelector('.co-public')).toHaveAttribute('data-motion', 'reduced'));
  });

  test('an unknown URL shows a 404 and exposes nothing private', async () => {
    at('/definitely-not-a-page');
    render(<App authClient={null} />);
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(shell()).not.toBeInTheDocument();
  });
});

describe('identity', () => {
  test('missing auth configuration is stated truthfully and sign-in is disabled', async () => {
    at('/login');
    render(<App authClient={null} />);
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
    expect(screen.getByText('Sign-in is not available in this environment')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Email me a sign-in link/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument();
  });

  test('magic link is requested for existing users only, returning to a safe path', async () => {
    at('/login?next=https://evil.example/steal');
    const { client, auth } = fakeClient(null);
    render(<App authClient={client} />);
    await userEvent.type(await screen.findByLabelText('Work email'), 'operator@example.test');
    await userEvent.click(screen.getByRole('button', { name: /Email me a sign-in link/ }));
    expect(await screen.findByText(/a sign-in link is on its way/)).toBeInTheDocument();
    const [{ email, options }] = auth.signInWithOtp.mock.calls[0] as unknown as [{ email: string; options: { shouldCreateUser: boolean; emailRedirectTo: string } }];
    expect(email).toBe('operator@example.test');
    expect(options.shouldCreateUser).toBe(false);
    const redirect = new URL(options.emailRedirectTo);
    expect(redirect.origin).toBe(window.location.origin);
    expect(redirect.pathname).toBe('/auth/callback');
    expect(redirect.searchParams.get('next')).toBe('/app');
  });

  test('a failed sign-in start shows a friendly error', async () => {
    at('/login');
    const { client, auth } = fakeClient(null);
    auth.signInWithOtp.mockResolvedValueOnce({ error: new Error('rate limited') } as never);
    render(<App authClient={client} />);
    await userEvent.type(await screen.findByLabelText('Work email'), 'operator@example.test');
    await userEvent.click(screen.getByRole('button', { name: /Email me a sign-in link/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not start email sign-in');
  });

  test('callback exchanges the code once and continues to the requested private page', async () => {
    at('/auth/callback?code=pkce-code&next=%2Fapp%2Fsales');
    mockApi({ '/api/app/session': () => json(membership('operator')), '/api/app/sales/summary': () => json(emptySummary), '/api/app/sales/accounts': () => json({ accounts: [] }) });
    const { client, auth } = fakeClient(null);
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument();
    expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(window.location.pathname).toBe('/app/sales');
  });

  test.each([
    ['/auth/callback', 'no code'],
    ['/auth/callback?error=access_denied&code=x', 'provider error'],
  ])('callback %s (%s) fails safely', async (path) => {
    at(path);
    const { client, auth } = fakeClient(null);
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(shell()).not.toBeInTheDocument();
  });

  test('a rejected code exchange fails safely', async () => {
    at('/auth/callback?code=stale');
    const { client, auth } = fakeClient(null);
    auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('invalid grant') } as never);
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument();
  });

  test('a restored session enters the workspace after a refresh', async () => {
    at('/app/overview');
    mockApi({ '/api/app/session': () => json(membership('founder')), '/api/app/sales/summary': () => json(emptySummary) });
    const { client, auth } = fakeClient();
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(auth.getSession).toHaveBeenCalled();
  });

  test('sign out ends the local session and returns to a public page', async () => {
    at('/app/overview');
    sessionStorage.setItem('cornerops-console-token', 'legacy');
    mockApi({ '/api/app/session': () => json(membership('founder')), '/api/app/sales/summary': () => json(emptySummary) });
    const { client, auth } = fakeClient();
    render(<App authClient={client} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(sessionStorage.getItem('cornerops-console-token')).toBeNull();
    expect(shell()).not.toBeInTheDocument();
  });
});

describe('workspace guard', () => {
  test.each([
    ['/app', '/app'], ['/app/sales', '/app/sales'], ['/app/admin/settings', '/app/admin/settings'],
    ['/app/labs/commerce-os/orders', '/app/labs/commerce-os/orders'], ['/app/labs/deferred/marketing', '/app/labs/deferred/marketing'],
    ['/overview', '/overview'], ['/orders', '/orders'], ['/settings', '/settings'], ['/authorized-sellers/abc', '/authorized-sellers/abc'],
    ['/app/anything/else', '/app/anything/else'],
  ])('anonymous %s is sent to sign in and nothing private renders', async (path, next) => {
    at(path);
    const fetchSpy = mockApi({});
    render(<App authClient={fakeClient(null).client} />);
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(new URLSearchParams(window.location.search).get('next')).toBe(next);
    expect(shell()).not.toBeInTheDocument();
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api'))).toEqual([]);
  });

  test('private routes are closed when authentication is not configured', async () => {
    at('/app/sales');
    render(<App authClient={null} />);
    expect(await screen.findByText('Sign-in is not available in this environment')).toBeInTheDocument();
    expect(shell()).not.toBeInTheDocument();
  });

  test('an authenticated user without membership lands on access pending', async () => {
    at('/app/sales');
    const fetchSpy = mockApi({ '/api/app/session': () => json({ authenticated: true, user: { id: USER_ID }, workspaces: [] }) });
    render(<App authClient={fakeClient().client} />);
    expect(await screen.findByRole('heading', { name: 'Workspace access has not been granted' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/access-pending');
    expect(shell()).not.toBeInTheDocument();
    expect(fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/app/sales'))).toEqual([]);
  });

  test('the shell never renders before the backend confirms membership', async () => {
    at('/app/overview');
    let release: (response: Response) => void = () => undefined;
    mockApi({ '/api/app/session': () => new Promise<Response>((resolve) => { release = resolve; }), '/api/app/sales/summary': () => json(emptySummary) });
    render(<App authClient={fakeClient().client} />);
    expect(await screen.findByText('Checking workspace access…')).toBeInTheDocument();
    expect(shell()).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument();
    release(json(membership('viewer')));
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(shell()).toBeInTheDocument();
  });

  test('backend unavailable keeps the workspace closed with a truthful message and retry', async () => {
    at('/app/overview');
    let available = false;
    mockApi({ '/api/app/session': () => (available ? json(membership('founder')) : json({ error: true }, 503)), '/api/app/sales/summary': () => json(emptySummary) });
    render(<App authClient={fakeClient().client} />);
    expect(await screen.findByRole('heading', { name: 'Workspace access could not be verified' })).toBeInTheDocument();
    expect(shell()).not.toBeInTheDocument();
    available = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });

  test('a session the backend rejects is dropped and sent back to sign in', async () => {
    at('/app/overview');
    mockApi({ '/api/app/session': () => json({ error: true, code: 'APP_SESSION_INVALID' }, 401) });
    const { client, auth } = fakeClient();
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(shell()).not.toBeInTheDocument();
  });

  test('API calls carry the session token and active workspace, not a stored shared token', async () => {
    at('/app/sales');
    const fetchSpy = mockApi({ '/api/app/session': () => json(membership('operator')), '/api/app/sales/summary': () => json(emptySummary), '/api/app/sales/accounts': () => json({ accounts: [] }) });
    render(<App authClient={fakeClient().client} />);
    await screen.findByText('No accounts yet');
    const call = fetchSpy.mock.calls.find(([url]) => String(url).includes('/api/app/sales/accounts'));
    const headers = (call?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer aaa.bbb.ccc');
    expect(headers['x-cornerops-workspace']).toBe('cornerops-ai');
  });

  test.each([
    ['/overview', '/app/overview'], ['/work-queue', '/app/work-queue'], ['/audit-log', '/app/audit'],
    ['/orders', '/app/labs/commerce-os/orders'], ['/leads', '/app/labs/commerce-os/cornermex-leads'],
    ['/marketing/campaigns', '/app/labs/deferred/marketing/campaigns'], ['/authorized-sellers/seller-1', '/app/labs/commerce-os/authorized-sellers/seller-1'],
  ])('legacy %s redirects to %s inside the guard', async (legacy, canonical) => {
    at(legacy);
    mockApi({ '/api/app/session': () => json(membership('founder')), '/api/app/sales/summary': () => json(emptySummary) });
    render(<App authClient={fakeClient().client} />);
    await waitFor(() => expect(window.location.pathname).toBe(canonical));
    expect(shell()).toBeInTheDocument();
  });
});

describe('workspace shell and navigation', () => {
  const open = async (role: Role, path = '/app/overview') => {
    at(path);
    mockApi({ '/api/app/session': () => json(membership(role)), '/api/app/sales/summary': () => json(emptySummary), '/api/app/sales/accounts': () => json({ accounts: [] }) });
    render(<App authClient={fakeClient().client} />);
    return within(await screen.findByRole('navigation', { name: 'Workspace navigation' }));
  };

  test('founder sees Core and Admin, with Commerce OS as a separate collapsed incubator', async () => {
    const nav = await open('founder');
    ['Overview', 'Sales', 'Work Queue', 'Intelligence', 'Approvals', 'Audit'].forEach((label) => expect(nav.getByRole('link', { name: label })).toBeInTheDocument());
    expect(nav.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/app/admin/settings');
    const incubator = nav.getByRole('button', { name: 'Commerce OS · Incubator' });
    expect(incubator).toHaveAttribute('aria-expanded', 'false');
    expect(nav.queryByRole('link', { name: 'Orders' })).not.toBeInTheDocument();
    await userEvent.click(incubator);
    expect(nav.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/app/labs/commerce-os/orders');
    expect(nav.getAllByRole('link').length).toBeLessThan(35);
    ['Marketing Hub', 'Promotions', 'Campaign Planner', 'Telegram', 'Flow Engine'].forEach((label) => expect(nav.queryByRole('link', { name: label })).not.toBeInTheDocument());
  });

  test('viewer sees no Admin group and is refused an admin deep link', async () => {
    const nav = await open('viewer', '/app/admin/settings');
    expect(nav.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(await screen.findByText('Not available for your role')).toBeInTheDocument();
  });

  test('the workspace is CornerOps AI, not CornerMex', async () => {
    await open('founder');
    const sidebar = document.querySelector('.sidebar-footer') as HTMLElement;
    expect(within(sidebar).getByText('CornerOps AI')).toBeInTheDocument();
    expect(within(sidebar).getByText('founder access')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/CornerMex UAE|Unified Command Center v1\.15/);
  });

  test('overview shows truthful empty and not-connected states, never invented metrics', async () => {
    await open('founder');
    expect(await screen.findByText('No accounts have been recorded yet.')).toBeInTheDocument();
    expect(screen.getAllByText('Not connected').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/489|\$\s?\d/);
  });

  test('a hidden module stays reachable for a member by direct URL', async () => {
    await open('founder', '/app/labs/deferred/marketing');
    expect(await screen.findByRole('heading', { name: 'Marketing Hub' })).toBeInTheDocument();
  });

  test('an unknown /app path shows an in-app not found', async () => {
    await open('founder', '/app/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(shell()).toBeInTheDocument();
  });

  test('mobile navigation opens, closes on selection and is keyboard reachable', async () => {
    await open('operator');
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    expect(sidebar).not.toHaveClass('sidebar-open');
    const menu = screen.getByRole('button', { name: 'Open navigation' });
    menu.focus();
    await userEvent.keyboard('{Enter}');
    expect(sidebar).toHaveClass('sidebar-open');
    await userEvent.click(within(sidebar).getByRole('link', { name: 'Sales' }));
    expect(sidebar).not.toHaveClass('sidebar-open');
    expect(await screen.findByRole('heading', { name: 'Sales' })).toBeInTheDocument();
  });
});
