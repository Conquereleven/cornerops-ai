import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import PublicApp from './PublicApp';
import { websiteV2Content } from './config/publicContent';

beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); window.history.replaceState({}, '', '/'); });

test.each(['/login', '/app/sales', '/overview', '/orders', '/settings', '/unknown'])('public entry does not expose private data at %s', path => {
  window.history.replaceState({}, '', path);
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  render(<PublicApp />);
  expect(screen.getByRole('heading', { name: 'Page unavailable' })).toBeInTheDocument();
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  expect(fetchSpy).not.toHaveBeenCalled();
});

test.each([
  ['/', 'home'], ['/products/commerce', 'commerce'], ['/solutions', 'solutions'],
] as const)('public route %s consumes single-source metadata and never requests private APIs', async (path, id) => {
  window.history.replaceState({}, '', path);
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  render(<PublicApp />);
  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading).toHaveTextContent(websiteV2Content.routes[id].h1);
  await waitFor(() => expect(heading).toHaveFocus());
  expect(document.title).toBe(websiteV2Content.routes[id].title);
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
});

test('navigation crosses routes and returns to the home contact heading with focus', async () => {
  render(<PublicApp />);
  const nav = screen.getAllByRole('navigation')[0];
  await userEvent.click(within(nav).getByRole('link', { name: websiteV2Content.navigation.commerce }));
  expect(window.location.pathname).toBe('/products/commerce');
  await userEvent.click(within(screen.getAllByRole('navigation')[0]).getByRole('link', { name: websiteV2Content.navigation.contact }));
  expect(window.location.pathname + window.location.hash).toBe('/#contact');
  await waitFor(() => expect(document.querySelector('#contact h2')).toHaveFocus());
});


test('Back restores the saved long-page offset after navigating to a shorter route', async () => {
  render(<PublicApp />);
  const user = userEvent.setup();
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 6200 });
  fireEvent.scroll(window);
  await user.click(within(screen.getAllByRole('navigation')[0]).getByRole('link', { name: websiteV2Content.navigation.commerce }));
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  window.history.back();
  await waitFor(() => expect(window.location.pathname).toBe('/'));
  await waitFor(() => expect(window.scrollTo).toHaveBeenLastCalledWith(0, 6200));
  expect(document.querySelector('main')).toHaveFocus();
});


test('client navigation updates canonical/social metadata and unknown routes remove public canonical', async () => {
  const { unmount } = render(<PublicApp />);
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href','https://cornertech.ae/');
  await userEvent.click(within(screen.getAllByRole('navigation')[0]).getByRole('link', {name:websiteV2Content.navigation.commerce}));
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href','https://cornertech.ae/products/commerce');
  expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content',websiteV2Content.routes.commerce.title);
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
  act(() => { window.history.pushState({},'', '/unknown'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await waitFor(() => expect(screen.getByRole('heading',{name:'Page unavailable'})).toHaveFocus());
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('meta[property="og:url"]')).toBeNull();
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
  unmount();
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(0);
});
