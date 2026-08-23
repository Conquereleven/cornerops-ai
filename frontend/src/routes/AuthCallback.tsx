import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeNextPath } from '../auth/routeSecurity';
import '../styles/public.css';

export function AuthCallback() {
  const { completeAuthCallback, configured } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const code = searchParams.get('code');
  const providerError = searchParams.get('error');
  const next = safeNextPath(searchParams.get('next'));

  useEffect(() => {
    if (!configured || providerError || !code) {
      setError('The sign-in response was missing or invalid. Start again from the CornerOps login page.');
      return;
    }
    let active = true;
    void completeAuthCallback(code)
      .then(() => {
        if (active) navigate(next, { replace: true });
      })
      .catch(() => {
        if (active) setError('CornerOps could not complete sign-in. The session was not accepted.');
      });
    return () => { active = false; };
  }, [code, completeAuthCallback, configured, navigate, next, providerError]);

  return <main className="co-public co-auth-state">
    {error ? <><AlertTriangle aria-hidden="true" /><h1>Sign-in failed</h1><p role="alert">{error}</p><Link className="co-public-secondary" to="/login">Return to sign in</Link></> : <><LoaderCircle className="spin" aria-hidden="true" /><h1>Completing secure sign-in</h1><p role="status">Verifying the callback and restoring your session…</p></>}
  </main>;
}
