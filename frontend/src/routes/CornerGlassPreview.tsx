import {
  AlertTriangle, Bell, Boxes, ChevronDown, CircleAlert, CircleCheck, CircleHelp,
  Command, Eye, FileText, Layers, Menu, PanelRightOpen, Radio, Server, ShieldCheck, Sparkles, UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/cornerglass.css';
import {
  GlassCommandPalette, GlassDetailPanel, GlassDrawer, GlassPopover, GlassSurface, GlassToolbar,
  type GlassCommandAction,
} from '../components/cornerglass';

/* Static, sanitized preview fixtures — NON-PRODUCTION. No real customer, order or payment data. */
const NAV = [
  { key: 'overview', label: 'Overview', icon: Layers, active: true },
  { key: 'work-queue', label: 'Work Queue', icon: Boxes },
  { key: 'fulfillment', label: 'Fulfillment', icon: PanelRightOpen },
  { key: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
  { key: 'audit', label: 'Audit Log', icon: FileText },
];
const METRICS = [
  { label: 'Open work items', value: '—', note: 'unknown · demo' },
  { label: 'Awaiting Intermex', value: '3', note: 'sample only' },
  { label: 'Unreconciled COD', value: '—', note: 'unconfigured' },
  { label: 'Fulfillment blockers', value: '1', note: 'sample only' },
];
const ROWS = [
  { id: 'DEMO-1', subject: 'Handoff confirmation', state: 'ok', label: 'Confirmed' },
  { id: 'DEMO-2', subject: 'Inventory report', state: 'unknown', label: 'Unknown' },
  { id: 'DEMO-3', subject: 'Bank transfer receipt', state: 'warn', label: 'Pending verification' },
  { id: 'DEMO-4', subject: 'Carrier dispatch', state: 'info', label: 'In transit' },
];

type Tone = 'ok' | 'info' | 'warn' | 'crit' | 'unknown';
function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const Icon = tone === 'ok' ? CircleCheck : tone === 'warn' ? AlertTriangle : tone === 'crit' ? CircleAlert
    : tone === 'unknown' ? CircleHelp : Radio;
  return (
    <span className={`cg-status cg-status--${tone}`}>
      <Icon size={12} aria-hidden="true" />{children}
    </span>
  );
}

export default function CornerGlassPreview() {
  const [reducedTransparency, setReducedTransparency] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);

  const connectionAnchorRef = useRef<HTMLDivElement | null>(null);
  const operatorAnchorRef = useRef<HTMLDivElement | null>(null);

  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // Truthful modal isolation: while any modal overlay is open the background shell is inert,
  // hidden from the accessibility tree, and body scroll is locked (restored exactly on close).
  const modalOpen = drawerOpen || paletteOpen || detailOpen;
  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const paletteActions: GlassCommandAction[] = useMemo(() => [
    { id: 'nav-overview', label: 'Go to Overview (preview)', hint: 'preview', icon: <Layers size={15} />, onRun: closePalette },
    { id: 'open-detail', label: 'Open detail panel', hint: 'preview', icon: <PanelRightOpen size={15} />, onRun: () => { setDetailOpen(true); closePalette(); } },
    { id: 'toggle-rt', label: 'Toggle reduced transparency', hint: 'preview', icon: <Eye size={15} />, onRun: () => { setReducedTransparency((v) => !v); closePalette(); } },
    { id: 'approve', label: 'Approve payment', icon: <ShieldCheck size={15} />, disabled: true },
    { id: 'send', label: 'Send quote', icon: <FileText size={15} />, disabled: true },
  ], [closePalette]);

  const rootClass = ['cg-root', forceFallback ? 'cg-force-fallback' : ''].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-cornerglass-transparency={reducedTransparency ? 'reduced' : 'standard'}
      data-cornerglass-motion={reducedMotion ? 'reduced' : 'standard'}
      data-testid="cornerglass-root"
    >
      <div className="cg-canvas">
        <div className="cg-shell" inert={modalOpen} aria-hidden={modalOpen || undefined}>
          {/* Desktop sidebar (glass) */}
          <GlassSurface as="aside" className="cg-sidebar cg-desktop-only" aria-label="Preview navigation">
            <div className="cg-brand">
              <span className="cg-brand-mark"><Boxes size={20} /></span>
              <span><strong>CornerGlass</strong><small>Design preview</small></span>
            </div>
            <nav className="cg-nav" aria-label="Preview modules">
              <span className="cg-nav-label">Command Center</span>
              {NAV.map(({ key, label, icon: Icon, active }) => (
                <a key={key} href={`#${key}`} className={active ? 'cg-nav-active' : ''} aria-current={active ? 'page' : undefined}>
                  <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
                </a>
              ))}
            </nav>
          </GlassSurface>

          <div className="cg-main">
            {/* Topbar (glass) with state toggles */}
            <GlassSurface as="header" className="cg-topbar">
              <button type="button" className="cg-icon-btn cg-mobile-only" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                <Menu size={18} />
              </button>
              <div>
                <span className="cg-eyebrow">CO-UX-1.1 · CornerGlass</span>
                <h1>Command Center — Design Preview</h1>
              </div>
              <span className="cg-spacer" />
              <span className="cg-preview-badge"><Sparkles size={12} /> NON-PRODUCTION PREVIEW</span>

              <div className="cg-popover-anchor" ref={connectionAnchorRef}>
                <button type="button" className="cg-toggle" aria-expanded={connectionOpen} onClick={() => setConnectionOpen((v) => !v)}>
                  <Server size={14} /> Connection <ChevronDown size={12} />
                </button>
                <GlassPopover open={connectionOpen} onClose={() => setConnectionOpen(false)} label="Connection status" anchorRef={connectionAnchorRef}>
                  <h3>Connection</h3>
                  <div className="cg-popover-row"><StatusChip tone="unknown">Backend</StatusChip><span className="cg-note">Preview — not wired to a live backend.</span></div>
                  <div className="cg-popover-row"><StatusChip tone="unknown">Latency</StatusChip><span className="cg-note">Unknown in preview.</span></div>
                </GlassPopover>
              </div>

              <div className="cg-popover-anchor" ref={operatorAnchorRef}>
                <button type="button" className="cg-toggle" aria-expanded={operatorOpen} onClick={() => setOperatorOpen((v) => !v)}>
                  <UserRound size={14} /> Operator <ChevronDown size={12} />
                </button>
                <GlassPopover open={operatorOpen} onClose={() => setOperatorOpen(false)} label="Operator menu" anchorRef={operatorAnchorRef}>
                  <div className="cg-popover-row">
                    <span className="cg-avatar">OP</span>
                    <span><strong style={{ color: '#fff', fontSize: 11, display: 'block' }}>Preview Operator</strong><small className="cg-note">Read-only prototype</small></span>
                  </div>
                  <p className="cg-note">This menu is illustrative. No account action is available in the prototype.</p>
                </GlassPopover>
              </div>
            </GlassSurface>

            <main className="cg-content">
              {/* Toolbar (glass) + overlay openers */}
              <GlassToolbar label="Preview controls">
                <button type="button" className="cg-btn" onClick={() => setPaletteOpen(true)}>
                  <Command size={14} /> Command palette <span className="cg-kbd-hint">⌘K</span>
                </button>
                <button type="button" className="cg-btn" onClick={() => setDetailOpen(true)}>
                  <PanelRightOpen size={14} /> Detail panel
                </button>
                <button type="button" className="cg-btn cg-mobile-only" onClick={() => setDrawerOpen(true)}>
                  <Menu size={14} /> Drawer
                </button>
                <span className="cg-spacer" />
                <select className="cg-select" aria-label="Sample filter" defaultValue="all">
                  <option value="all">All demo rows</option>
                  <option value="open">Open</option>
                </select>
              </GlassToolbar>

              {/* Visual-state toggles */}
              <GlassSurface className="cg-toolbar" aria-label="Visual state toggles" role="group">
                <span className="cg-note" style={{ marginRight: 4 }}>Demonstration states:</span>
                <button type="button" className="cg-toggle" aria-pressed={reducedTransparency} onClick={() => setReducedTransparency((v) => !v)}>Reduced transparency</button>
                <button type="button" className="cg-toggle" aria-pressed={reducedMotion} onClick={() => setReducedMotion((v) => !v)}>Reduced motion</button>
                <button type="button" className="cg-toggle" aria-pressed={forceFallback} onClick={() => setForceFallback((v) => !v)}>Simulate unsupported blur</button>
                <button type="button" className="cg-toggle" aria-pressed={loading} onClick={() => setLoading((v) => !v)}>Loading state</button>
              </GlassSurface>

              {/* SOLID dense operational content */}
              <section aria-label="Operational metrics">
                <div className="cg-section-title"><h2>Operational metrics</h2><span>solid content · glass stays on navigation</span></div>
                <div className="cg-metrics" style={{ marginTop: 10 }}>
                  {METRICS.map((m) => (
                    <div key={m.label} className="cg-solid cg-metric">
                      <small>{m.label}</small>
                      <strong>{m.value}</strong>
                      <span className="cg-metric-note">{m.note}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Critical alert — SOLID opaque, high contrast */}
              <div className="cg-critical" role="alert">
                <CircleAlert size={20} className="cg-critical-icon" aria-hidden="true" />
                <div>
                  <strong>Critical: unresolved fulfillment blocker (demo)</strong>
                  <p>Critical alerts are always solid and opaque — never glass, never conveyed by colour alone. This is sample data.</p>
                </div>
              </div>

              {/* Warning notice */}
              <div className="cg-warning">
                <AlertTriangle size={18} aria-hidden="true" />
                <div>
                  <strong>Warning: bank transfer awaiting verification (demo)</strong>
                  <p>Unknown, unavailable and unconfigured states stay explicit. Transparency never implies confidence.</p>
                </div>
              </div>

              {/* SOLID data table, or loading/empty states */}
              <section aria-label="Operational records">
                <div className="cg-section-title"><h2>Records</h2><span>solid table</span></div>
                {loading ? (
                  <div className="cg-solid cg-skeleton-row" aria-busy="true" aria-label="Loading records">
                    <div className="cg-skeleton cg-skeleton--w40" />
                    <div className="cg-skeleton cg-skeleton--w60" />
                    <div className="cg-skeleton" />
                    <div className="cg-skeleton cg-skeleton--w60" />
                  </div>
                ) : (
                  <div className="cg-solid cg-table-wrap" style={{ marginTop: 10 }}>
                    <table className="cg-table">
                      <caption>Sample records (non-production)</caption>
                      <thead><tr><th>ID</th><th>Subject</th><th>Status</th></tr></thead>
                      <tbody>
                        {ROWS.map((r) => (
                          <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.subject}</td>
                            <td><StatusChip tone={r.state as Tone}>{r.label}</StatusChip></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Empty state */}
              <section aria-label="Empty example">
                <div className="cg-section-title"><h2>Unconfigured source</h2><span>explicit empty state</span></div>
                <div className="cg-empty" style={{ marginTop: 10 }}>
                  <strong>No data source configured</strong>
                  <p>Missing information stays explicit — it is never hidden behind blur or shown as zero.</p>
                </div>
              </section>

              <p className="cg-note">
                CornerGlass prototype · glass belongs to navigation and overlays; dense operational content and
                critical alerts remain solid. This preview writes nothing and calls no backend.
              </p>
            </main>
          </div>
        </div>

        {/* Overlays */}
        <GlassDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} label="Navigation">
          <nav className="cg-nav" aria-label="Preview modules (mobile)">
            {NAV.map(({ key, label, icon: Icon, active }) => (
              <a key={key} href={`#${key}`} className={active ? 'cg-nav-active' : ''} onClick={() => setDrawerOpen(false)}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              </a>
            ))}
          </nav>
        </GlassDrawer>

        <GlassCommandPalette open={paletteOpen} onClose={closePalette} actions={paletteActions} />

        <GlassDetailPanel open={detailOpen} onClose={() => setDetailOpen(false)} title="Work item — DEMO-2">
          <div className="cg-evidence cg-solid">
            <h3>Evidence (solid inner region)</h3>
            <dl>
              <dt>Reference</dt><dd>DEMO-2</dd>
              <dt>Inventory</dt><dd><StatusChip tone="unknown">Unknown</StatusChip></dd>
              <dt>Handoff</dt><dd><StatusChip tone="ok">Confirmed</StatusChip></dd>
              <dt>Bank transfer</dt><dd><StatusChip tone="warn">Pending</StatusChip></dd>
            </dl>
          </div>
          <div className="cg-critical" role="alert">
            <CircleAlert size={18} className="cg-critical-icon" aria-hidden="true" />
            <div><strong>Critical (demo)</strong><p>Solid opaque alert inside the glass shell.</p></div>
          </div>
          <p className="cg-note">Sanitized sample data only. Closing returns focus to the control that opened this panel.</p>
        </GlassDetailPanel>
      </div>
    </div>
  );
}
