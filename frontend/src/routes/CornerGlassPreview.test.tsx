import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import CornerGlassPreview from './CornerGlassPreview';
import { moduleRegistry } from '../config/moduleRegistry';

describe('CornerGlass preview', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network access is not allowed in the CornerGlass preview'));
  });
  afterEach(() => vi.restoreAllMocks());

  test('renders as a non-production design preview', () => {
    render(<CornerGlassPreview />);
    expect(screen.getByText('NON-PRODUCTION PREVIEW')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Command Center — Design Preview' })).toBeInTheDocument();
  });

  test('performs no network / mutation request', () => {
    render(<CornerGlassPreview />);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('command palette opens with dialog semantics, closes on Escape and returns focus to opener', async () => {
    const user = userEvent.setup();
    render(<CornerGlassPreview />);
    const opener = screen.getByRole('button', { name: /command palette/i });
    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: /command palette/i });
    expect(dialog).toBeInTheDocument();
    // focus moved into the dialog
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument());
    // focus returned to the control that opened it
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  test('command palette marks controlled actions as disabled and non-executing', async () => {
    const user = userEvent.setup();
    render(<CornerGlassPreview />);
    await user.click(screen.getByRole('button', { name: /command palette/i }));
    const dialog = await screen.findByRole('dialog', { name: /command palette/i });
    const approve = within(dialog).getByRole('button', { name: /approve payment/i });
    expect(approve).toBeDisabled();
  });

  test('mobile drawer exposes a labeled modal dialog', async () => {
    const user = userEvent.setup();
    render(<CornerGlassPreview />);
    // Drawer opener exists (rendered for mobile); click it directly.
    const openers = screen.getAllByRole('button', { name: /open navigation|drawer/i });
    await user.click(openers[0]);
    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
  });

  test('critical alert is solid (not a glass surface)', () => {
    const { container } = render(<CornerGlassPreview />);
    const alert = container.querySelector('.cg-critical');
    expect(alert).not.toBeNull();
    expect(alert).not.toHaveClass('cg-surface');
    // role=alert present and readable
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  test('reduced-transparency and fallback states are reflected on the root', async () => {
    const user = userEvent.setup();
    const { container } = render(<CornerGlassPreview />);
    const root = container.querySelector('[data-testid="cornerglass-root"]') as HTMLElement;
    expect(root).toHaveAttribute('data-cornerglass-transparency', 'standard');
    await user.click(screen.getByRole('button', { name: 'Reduced transparency' }));
    expect(root).toHaveAttribute('data-cornerglass-transparency', 'reduced');
    await user.click(screen.getByRole('button', { name: 'Simulate unsupported blur' }));
    expect(root).toHaveClass('cg-force-fallback');
    await user.click(screen.getByRole('button', { name: 'Reduced motion' }));
    expect(root).toHaveAttribute('data-cornerglass-motion', 'reduced');
  });

  test('detail panel opens with dialog semantics and shows an explicit unknown state', async () => {
    const user = userEvent.setup();
    render(<CornerGlassPreview />);
    await user.click(screen.getByRole('button', { name: /detail panel/i }));
    const panel = await screen.findByRole('dialog', { name: /work item — demo-2/i });
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(within(panel).getByText('Unknown')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /work item/i })).not.toBeInTheDocument());
  });

  test('preview route is not part of the production module registry', () => {
    expect(moduleRegistry.some((m) => m.route.includes('cornerglass') || m.route.startsWith('/design'))).toBe(false);
  });

  // Finding 2 — popover trigger-close race
  test('connection popover: one click opens, a second click on the same trigger closes it deterministically', async () => {
    const user = userEvent.setup();
    render(<CornerGlassPreview />);
    const trigger = screen.getByRole('button', { name: /connection/i });
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Connection status' })).toBeInTheDocument();
    await user.click(trigger);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Connection status' })).not.toBeInTheDocument());
  });

  test('operator popover: outside click and Escape both close it and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    render(<CornerGlassPreview />);
    const trigger = screen.getByRole('button', { name: /operator/i });

    // outside click closes
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Operator menu' })).toBeInTheDocument();
    await user.click(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Operator menu' })).not.toBeInTheDocument());

    // Escape closes and focus returns to the trigger
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Operator menu' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Operator menu' })).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  // Finding 3 — modal background isolation
  test('background shell becomes inert + aria-hidden while a modal is open, and body scroll is restored on close', async () => {
    const user = userEvent.setup();
    const { container } = render(<CornerGlassPreview />);
    const shell = container.querySelector('.cg-shell') as HTMLElement;
    const originalOverflow = document.body.style.overflow;

    expect(shell.hasAttribute('inert')).toBe(false);
    expect(shell.getAttribute('aria-hidden')).toBeNull();

    await user.click(screen.getByRole('button', { name: /command palette/i }));
    await screen.findByRole('dialog', { name: /command palette/i });
    expect(shell.hasAttribute('inert')).toBe(true);
    expect(shell.getAttribute('aria-hidden')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /command palette/i })).not.toBeInTheDocument());
    expect(shell.hasAttribute('inert')).toBe(false);
    expect(shell.getAttribute('aria-hidden')).toBeNull();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  test('detail panel also makes the shell inert while open', async () => {
    const user = userEvent.setup();
    const { container } = render(<CornerGlassPreview />);
    const shell = container.querySelector('.cg-shell') as HTMLElement;
    await user.click(screen.getByRole('button', { name: /detail panel/i }));
    await screen.findByRole('dialog', { name: /work item/i });
    expect(shell.hasAttribute('inert')).toBe(true);
    expect(shell.getAttribute('aria-hidden')).toBe('true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(shell.hasAttribute('inert')).toBe(false));
  });
});
