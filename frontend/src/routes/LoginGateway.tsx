import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/public.css';

export function LoginGateway() {
  return (
    <main className="co-public co-login-page cg-root">
      <section className="co-login-shell" aria-labelledby="co-login-title">
        <Link className="co-login-back" to="/"><ArrowLeft size={15} /> Back to CornerOps</Link>
        <div className="co-login-card">
          <div className="co-login-brand-mark">C</div>
          <span className="co-public-eyebrow">Operator access</span>
          <h1 id="co-login-title">Sign in to CornerOps</h1>
          <p>
            Authentication is intentionally not enabled in this visual foundation sprint. The real identity and workspace authorization flow will be connected in CO-WEB-1D.
          </p>
          <div className="co-login-status" role="status">
            <LockKeyhole size={18} />
            <div>
              <strong>Access gateway staged</strong>
              <span>No placeholder credential or fake login path is active.</span>
            </div>
          </div>
          <button className="co-login-disabled" type="button" disabled>Authentication pending gated integration</button>
          <small className="co-login-note"><ShieldCheck size={14} /> Workspace membership will be checked after identity verification.</small>
        </div>
      </section>
    </main>
  );
}
