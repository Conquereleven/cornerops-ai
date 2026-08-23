import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeNextPath } from '../auth/routeSecurity';
import '../styles/public.css';

export function LoginGateway() {
  const { configured, googleEnabled, loading, sendMagicLink, session, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const next = safeNextPath(searchParams.get('next'));

  if (!loading && session) return <Navigate to={next} replace />;

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setSent(false);
    try {
      await sendMagicLink(email.trim(), next);
      setSent(true);
    } catch {
      setError('CornerOps could not start email sign-in. Check the address or contact an administrator.');
    } finally { setBusy(false); }
  };

  const googleLogin = async () => {
    setBusy(true); setError('');
    try { await signInWithGoogle(next); }
    catch { setError('Google sign-in is unavailable or not configured for this environment.'); setBusy(false); }
  };

  return <main className="co-public co-login-page cg-root">
    <section className="co-login-shell" aria-labelledby="co-login-title">
      <Link className="co-login-back" to="/"><ArrowLeft size={15} /> Back to CornerOps</Link>
      <div className="co-login-card">
        <div className="co-login-brand-mark">C</div>
        <span className="co-public-eyebrow">Operator access</span>
        <h1 id="co-login-title">Sign in to CornerOps</h1>
        <p>Verify your identity first. Workspace membership is checked separately and remains fail-closed until CO-WEB-1F.</p>
        {!configured && <div className="co-login-status" role="status"><ShieldCheck size={18} /><div><strong>Authentication configuration required</strong><span>This environment has no public Supabase URL and publishable key. Sign-in is disabled safely.</span></div></div>}
        <form className="co-login-form" onSubmit={(event) => void submitEmail(event)}>
          <label htmlFor="operator-email">Operator email</label>
          <input id="operator-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={!configured || busy} />
          <button className="co-login-primary" type="submit" disabled={!configured || busy || !email.trim()}><Mail size={15} /> Email secure sign-in link</button>
        </form>
        {googleEnabled && <button className="co-login-google" type="button" disabled={busy} onClick={() => void googleLogin()}>Continue with Google</button>}
        {sent && <p className="co-auth-success" role="status">If this email belongs to an existing operator, a secure sign-in link has been sent.</p>}
        {error && <p className="co-auth-error" role="alert">{error}</p>}
        <small className="co-login-note"><ShieldCheck size={14} /> Workspace membership will be checked after identity verification.</small>
      </div>
    </section>
  </main>;
}
