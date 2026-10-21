import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import PublicApp from './PublicApp';

afterEach(() => { vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });

test.each(['/login', '/app/sales', '/overview', '/orders', '/settings', '/unknown'])('public entry does not expose private data at %s', path => {
  window.history.replaceState({}, '', path);
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  render(<PublicApp />);
  expect(screen.getByRole('heading', { name: 'Page unavailable' })).toBeInTheDocument();
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  expect(fetchSpy).not.toHaveBeenCalled();
});
