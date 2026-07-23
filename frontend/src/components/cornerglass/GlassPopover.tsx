import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Non-modal glass popover (operator / connection menus). Closes on Escape or outside
 * click and returns focus to the trigger. Focus is not trapped (non-modal), which is the
 * correct pattern for a lightweight menu popover.
 */
export function GlassPopover({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

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
