import { useEffect, useRef } from 'react';

/**
 * Accessibility core for CornerGlass modal overlays (command palette, detail panel, drawer).
 *
 * - Moves focus into the dialog on open, remembering the triggering element.
 * - Traps Tab / Shift+Tab within the dialog.
 * - Closes on Escape.
 * - Restores focus to the opener on close.
 *
 * Purely presentational/interaction behaviour — performs no network or backend action.
 */
const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useGlassDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement as HTMLElement | null;
    const node = ref.current;

    // All focusable descendants. We intentionally do not filter on offsetParent/visibility:
    // these dialogs never hide their own focusables, and offsetParent is unreliable outside a
    // real layout engine.
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    // Move focus into the dialog.
    const first = focusables()[0] ?? node;
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        node?.focus();
        return;
      }
      const activeIndex = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && (activeIndex <= 0)) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && activeIndex === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    };

    node?.addEventListener('keydown', onKeyDown);
    return () => {
      node?.removeEventListener('keydown', onKeyDown);
      // Restore focus to the element that opened the dialog.
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}
