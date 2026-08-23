import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import App from './App';

const originalMatchMedia = window.matchMedia;

function session(email = 'operator@example.com') {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'operator-1', email },
  } as Session;
}

function authClient(initialSession: Session | null, overrides: Record<string, unknown> = {}) {
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: initialSession }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: initialSession }, error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
  return { client: { auth } as unknown as SupabaseClient, auth };
}

describe('App authentication boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia });
    window.history.pushState({}, '', '/');
  });

  test('renders the public CornerOps landing at root', async () => {
    render(<App authClient={null} />);
    expect(await screen.findByRole('heading', { name: 'Run the company from the signal, not the noise.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operator sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByText('PRODUCT PREVIEW')).toBeInTheDocument();
  });

  test('keeps the landing static when reduced motion is requested', async () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) });
    const { container } = render(<App authClient={null} />);
    await waitFor(() => expect(container.querySelector('.co-public')).toHaveAttribute('data-motion', 'reduced'));
  });

  test('fails closed when Supabase Auth configuration is missing', async () => {
    window.history.pushState({}, '', '/login');
    render(<App authClient={null} />);
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
    expect(screen.getByText('Authentication configuration required')).toBeInTheDocument();
    expect(screen.getByLabelText('Operator email')).toBeDisabled();
  });

  test('starts email auth for an existing operator and preserves a safe next route', async () => {
    const { client, auth } = authClient(null);
    window.history.pushState({}, '', '/login?next=%2Foverview');
    render(<App authClient={client} />);
    await userEvent.type(await screen.findByLabelText('Operator email'), 'operator@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Email secure sign-in link' }));
    await waitFor(() => expect(auth.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'operator@example.com',
      options: expect.objectContaining({ shouldCreateUser: false }),
    })));
    expect(screen.getByText(/secure sign-in link has been sent/i)).toBeInTheDocument();
  });

  test.each(['/overview', '/app'])('redirects unauthenticated private route %s to login with next', async (path) => {
    const { client } = authClient(null);
    window.history.pushState({}, '', path);
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('next')).toBe(path);
  });

  test.each(['/overview', '/app'])('restores a session but keeps %s blocked without workspace authorization', async (path) => {
    const { client, auth } = authClient(session());
    window.history.pushState({}, '', path);
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Workspace access has not been granted' })).toBeInTheDocument();
    expect(auth.getSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/authentication does not grant access/i)).toBeInTheDocument();
  });

  test('exchanges a valid auth callback and lands in access pending', async () => {
    const restored = session();
    const { client, auth } = authClient(null, {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: restored }, error: null }),
    });
    window.history.pushState({}, '', '/auth/callback?code=valid-code&next=%2Foverview');
    render(<App authClient={client} />);
    await waitFor(() => expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-code'));
    expect(await screen.findByRole('heading', { name: 'Workspace access has not been granted' })).toBeInTheDocument();
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-code');
  });

  test('rejects a callback without a code', async () => {
    const { client, auth } = authClient(null);
    window.history.pushState({}, '', '/auth/callback?next=%2Foverview');
    render(<App authClient={client} />);
    expect(await screen.findByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  test('signs out an authenticated-but-unauthorized operator', async () => {
    const { client, auth } = authClient(session());
    window.history.pushState({}, '', '/access-pending');
    render(<App authClient={client} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' }));
    expect(await screen.findByRole('heading', { name: 'Sign in to CornerOps' })).toBeInTheDocument();
  });
});
