import { ArrowRight, Check, LockKeyhole, Radar, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/public.css';

const modules = [
  {
    icon: Radar,
    title: 'Founder Daily',
    copy: 'A single operating brief for what changed, what is blocked and what deserves attention next.',
  },
  {
    icon: Workflow,
    title: 'Work Queue',
    copy: 'Turn operational evidence into prioritized, traceable actions without hiding uncertainty.',
  },
  {
    icon: ShieldCheck,
    title: 'Approvals',
    copy: 'Keep sensitive actions behind explicit human decisions with audit-ready context.',
  },
  {
    icon: Sparkles,
    title: 'Operational Intelligence',
    copy: 'Synthesize commerce, supply and workflow signals into recommendations instead of noisy dashboards.',
  },
];

const safeguards = [
  'Read-only boundaries remain explicit where writes are not authorized.',
  'Unknown, unavailable and unverified states are shown truthfully.',
  'Sensitive execution stays behind approvals and capability gates.',
  'Audit evidence is treated as product infrastructure, not decoration.',
];

export function PublicLanding() {
  return (
    <main className="co-public cg-root">
      <header className="co-public-nav" aria-label="CornerOps public navigation">
        <Link className="co-public-brand" to="/" aria-label="CornerOps home">
          <span className="co-public-brand-mark">C</span>
          <span><strong>CornerOps</strong><small>Operational intelligence</small></span>
        </Link>
        <nav>
          <a href="#product">Product</a>
          <a href="#governance">Governance</a>
          <Link className="co-public-signin" to="/login">Sign in</Link>
        </nav>
      </header>

      <section className="co-public-hero" aria-labelledby="co-public-title">
        <div className="co-public-hero-copy">
          <span className="co-public-eyebrow">Founder-led commerce, one operating layer</span>
          <h1 id="co-public-title">Run the company from the signal, not the noise.</h1>
          <p>
            CornerOps brings operational evidence, work queues, approvals and commercial intelligence into one command center built for deliberate execution.
          </p>
          <div className="co-public-actions">
            <a className="co-public-primary" href="#product">Explore the product <ArrowRight size={16} /></a>
            <Link className="co-public-secondary" to="/login">Operator sign in</Link>
          </div>
          <div className="co-public-trustline">
            <ShieldCheck size={15} /> Human approval stays in the loop for controlled actions.
          </div>
        </div>

        <div className="co-public-command-preview" aria-label="Illustrative CornerOps command center preview">
          <div className="co-public-preview-topbar">
            <span>COMMAND CENTER</span>
            <span className="co-public-preview-badge">PRODUCT PREVIEW</span>
          </div>
          <div className="co-public-preview-grid">
            <article>
              <small>Founder Daily</small>
              <strong>3 decisions</strong>
              <span>2 blockers · 1 review</span>
            </article>
            <article>
              <small>Work Queue</small>
              <strong>Prioritized</strong>
              <span>Evidence-backed actions</span>
            </article>
            <article className="co-public-preview-wide">
              <small>Approval flow</small>
              <div className="co-public-flow">
                <span>Observe</span><i />
                <span>Recommend</span><i />
                <span>Prepare</span><i />
                <span>Approve</span>
              </div>
            </article>
            <article className="co-public-preview-wide co-public-preview-alert">
              <LockKeyhole size={17} />
              <div><small>Execution boundary</small><strong>Controlled by authorization</strong></div>
            </article>
          </div>
        </div>
      </section>

      <section className="co-public-section" id="product" aria-labelledby="co-public-product-title">
        <div className="co-public-section-heading">
          <span className="co-public-eyebrow">One command center</span>
          <h2 id="co-public-product-title">A calmer way to operate complexity.</h2>
          <p>CornerOps is designed to reduce operational ambiguity, not add another layer of dashboards.</p>
        </div>
        <div className="co-public-module-grid">
          {modules.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="co-public-module-card">
              <span className="co-public-icon"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="co-public-governance" id="governance" aria-labelledby="co-public-governance-title">
        <div>
          <span className="co-public-eyebrow">Operational governance</span>
          <h2 id="co-public-governance-title">AI that prepares the move before it makes the move.</h2>
          <p>
            CornerOps separates observation, recommendation, preparation, approval and execution so capability does not quietly become authority.
          </p>
        </div>
        <ul>
          {safeguards.map(item => <li key={item}><Check size={15} /> {item}</li>)}
        </ul>
      </section>

      <section className="co-public-cta">
        <span className="co-public-eyebrow">CornerOps</span>
        <h2>Operational clarity deserves its own operating system.</h2>
        <p>Public presentation is live on this branch. Authenticated workspace access is the next gated step.</p>
        <Link className="co-public-primary" to="/login">Go to sign in <ArrowRight size={16} /></Link>
      </section>

      <footer className="co-public-footer">
        <span>© CornerOps</span>
        <span>Operational intelligence for controlled execution.</span>
      </footer>
    </main>
  );
}
