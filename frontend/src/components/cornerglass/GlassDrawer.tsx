import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useGlassDialog } from './useGlassDialog';

/**
 * Mobile navigation drawer rendered as a modal glass surface. Traps focus, closes on
 * Escape or scrim click, and returns focus to the opener.
 */
export function GlassDrawer({
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
  const ref = useGlassDialog<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div className="cg-scrim cg-scrim--right" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={ref}
        className="cg-surface cg-surface--strong cg-drawer cg-anim-slide"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="cg-drawer-head">
          <strong style={{ color: '#fff', fontSize: 12 }}>{label}</strong>
          <button type="button" className="cg-icon-btn" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
