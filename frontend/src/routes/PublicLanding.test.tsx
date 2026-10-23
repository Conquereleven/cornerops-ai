import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PublicLanding } from './PublicLanding';

const open = () => render(<MemoryRouter><PublicLanding /></MemoryRouter>);

test('mobile menu announces state, closes on navigation and restores toggle focus on Escape', async () => {
  open();
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  const links = screen.getAllByRole('link', { name: 'Solutions' });
  await userEvent.click(links.find(link => link.closest('[id]')?.id.includes('menu')) || links[0]);
  expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
});

test('homepage shows truthful maturity, services and synthetic concepts without customer/private proof', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const { container } = open();
  expect(screen.getAllByText(/In development/i).length).toBeGreaterThan(0);
  for (const name of ['Custom Engineering', 'AI Automation', 'Systems Integration']) {
    expect(screen.getAllByText(name).length).toBeGreaterThan(0);
  }
  expect(screen.getByText('Illustration · synthetic data')).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/Tres Leches|CornerOps|ROI|revenue|testimonials|enterprise.grade/i);
  expect(container.querySelector('form')).toBeNull();
  const publishedTargets = new Set(['/', '/products/commerce', '/solutions', '/#company', '/#contact']);
  for (const link of container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')) {
    expect(publishedTargets.has(link.getAttribute('href') || '')).toBe(true);
  }
  expect(container.querySelectorAll('a[href*="wa.me"]')).toHaveLength(1);
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});
