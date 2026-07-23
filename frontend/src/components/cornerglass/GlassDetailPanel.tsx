import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useGlassDialog } from './useGlassDialog';

/**
 * Floating detail panel: a glass shell wrapping a SOLID inner evidence region.
 * Modal dialog semantics with focus trap, Escape-to-close and focus return.
 */
export function GlassDetailPanel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useGlassDialog<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div className="cg-scrim cg-scrim--right" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={ref}
        className="cg-surface cg-surface--strong cg-detail cg-anim-slide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cg-detail-title"
      >
        <div className="cg-detail-head">
          <h2 id="cg-detail-title">{title}</h2>
          <button type="button" className="cg-icon-btn" onClick={onClose} aria-label="Close detail panel">
            <X size={18} />
          </button>
        </div>
        <div className="cg-detail-body">{children}</div>
      </div>
    </div>
  );
}
