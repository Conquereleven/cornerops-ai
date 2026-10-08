import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const open = async (path: string) => {
  window.history.pushState({}, '', path);
  vi.resetModules();
  vi.stubEnv('VITE_PUBLIC_ONLY', 'true');
  const { default: PublicApp } = await import('./PublicApp');
  return render(<PublicApp />);
};

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); window.history.pushState({}, '', '/'); });

describe('public-only build', () => {
  test('shows the landing with contact channels, no sign-in and no API call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await open('/');
    expect(await screen.findByRole('heading', { name: 'Intelligence, engineered for business.' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="mailto:"]')).toBeInTheDocument();
    expect(document.querySelector('a[href^="https://wa.me/"]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Privacy' })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test.each(['/login', '/app', '/app/sales', '/app/admin/settings', '/auth/callback', '/access-pending', '/overview'])(
    '%s does not exist in this build',
    async (path) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await open(path);
      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Workspace navigation' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Work email')).not.toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );
});
