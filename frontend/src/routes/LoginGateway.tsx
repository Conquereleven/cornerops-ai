import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeNextPath } from '../auth/routeSecurity';
import '../styles/public.css';
import '../styles/cornertech.css';

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
      setError('Corner Tech AI could not start email sign-in. Check the address or contact an administrator.');
    } finally { setBusy(false); }
  };

  const googleLogin = async () => {
    setBusy(true); setError('');
    try { await signInWithGoogle(next); }
    catch { setError('Google sign-in is unavailable or not configured for this environment.'); setBusy(false); }
  };

  return <main className="co-public co-login-page cg-root">
    <section className="co-login-shell" aria-labelledby="co-login-title">
      <Link className="co-login-back" to="/"><ArrowLeft size={15} /> Back to Corner Tech AI</Link>
      <div className="co-login-card">
        <div className="co-login-brand-mark"><img src="/brand/logo-mark.png" alt="" width="40" height="32"/></div>
        <span className="co-public-eyebrow">Operator access</span>
        <h1 id="co-login-title">Sign in to Corner Tech AI</h1>
        <p>Sign in with your work email. Access to a workspace is checked separately after your identity is verified.</p>
        {!configured && <div className="co-login-status" role="status"><ShieldCheck size={18} /><div><strong>Sign-in is not available in this environment</strong><span>Authentication has not been configured here, so no sign-in can be started.</span></div></div>}
        <form className="co-login-form" onSubmit={(event) => void submitEmail(event)}>
          <label htmlFor="operator-email">Work email</label>
          <input id="operator-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={!configured || busy} />
          <button className="co-login-primary" type="submit" disabled={!configured || busy || !email.trim()}><Mail size={15} /> Email me a sign-in link</button>
        </form>
        {googleEnabled && <button className="co-login-google" type="button" disabled={busy} onClick={() => void googleLogin()}>Continue with Google</button>}
        {sent && <p className="co-auth-success" role="status">If this email belongs to an existing account, a sign-in link is on its way.</p>}
        {error && <p className="co-auth-error" role="alert">{error}</p>}
        <small className="co-login-note"><ShieldCheck size={14} /> New accounts cannot be created from this page.</small>
      </div>
    </section>
  </main>;
}
