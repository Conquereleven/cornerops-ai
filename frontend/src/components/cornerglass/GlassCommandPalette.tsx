import { Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useGlassDialog } from './useGlassDialog';

export interface GlassCommandAction {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Prototype-safe handler. Must not perform backend mutations. */
  onRun?: () => void;
}

/**
 * Prototype command palette (dialog semantics, focus trap, Escape closes, focus returns).
 * Contains only safe navigation/preview actions. It performs no backend mutation and never
 * implies a command has executed — disabled actions are clearly marked.
 */
export function GlassCommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: GlassCommandAction[];
}) {
  const ref = useGlassDialog<HTMLDivElement>(open, onClose);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => actions.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase())),
    [actions, query],
  );

  if (!open) return null;
  return (
    <div className="cg-scrim cg-scrim--center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={ref}
        className="cg-surface cg-surface--strong cg-palette cg-anim-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cg-palette-input">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search preview actions…"
            aria-label="Search preview actions"
          />
        </div>
        <ul className="cg-palette-list">
          {filtered.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                className="cg-palette-item"
                disabled={action.disabled}
                aria-disabled={action.disabled || undefined}
                onClick={() => { if (!action.disabled) { action.onRun?.(); } }}
              >
                {action.icon}
                <span>{action.label}</span>
                {action.disabled
                  ? <span className="cg-kbd-hint">Disabled in prototype</span>
                  : action.hint ? <span className="cg-kbd-hint">{action.hint}</span> : null}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li><div className="cg-palette-item" aria-disabled="true">No matching preview action</div></li>
          )}
        </ul>
        <p className="cg-palette-foot">Prototype only — navigation/preview actions do not execute controlled operations.</p>
      </div>
    </div>
  );
}
