import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

/**
 * Non-modal glass popover (operator / connection menus). Closes on Escape or outside
 * click and returns focus to the trigger. Focus is not trapped (non-modal), which is the
 * correct pattern for a lightweight menu popover.
 *
 * `anchorRef` should reference the element that contains BOTH the trigger and the popover.
 * Outside-pointer events originating inside that anchor are ignored, so pressing the trigger
 * while the popover is open cannot race the outside listener into a close-then-reopen: the
 * outside listener stays silent and the trigger's own onClick performs a single deterministic
 * toggle.
 */
export function GlassPopover({
  open,
  onClose,
  label,
  anchorRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  anchorRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore events inside the trigger+popover anchor (prevents the trigger-close race)…
      if (anchorRef?.current?.contains(target)) return;
      // …and inside the popover itself when no anchor is supplied.
      if (ref.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      openerRef.current?.focus?.();
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="cg-surface cg-surface--strong cg-popover cg-anim-in"
      role="dialog"
      aria-label={label}
    >
      {children}
    </div>
  );
}
