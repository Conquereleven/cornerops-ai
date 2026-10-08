import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeNextPath } from '../auth/routeSecurity';
import '../styles/public.css';

export function AuthCallback() {
  const { completeAuthCallback, configured } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const exchanged = useRef<string | null>(null);
  const code = searchParams.get('code');
  const providerError = searchParams.get('error');
  const next = safeNextPath(searchParams.get('next'));

  useEffect(() => {
    if (!configured || providerError || !code) {
      setError('The sign-in response was missing or invalid. Start again from the CornerTech AI login page.');
      return;
    }
    // A PKCE code is single-use: never exchange the same one twice.
    if (exchanged.current === code) return;
    exchanged.current = code;
    void completeAuthCallback(code)
      .then(() => navigate(next, { replace: true }))
      .catch(() => setError('CornerTech AI could not complete sign-in. The session was not accepted.'));
  }, [code, completeAuthCallback, configured, navigate, next, providerError]);

  return <main className="co-public co-auth-state">
    {error ? <><AlertTriangle aria-hidden="true" /><h1>Sign-in failed</h1><p role="alert">{error}</p><Link className="co-public-secondary" to="/login">Return to sign in</Link></> : <><LoaderCircle className="spin" aria-hidden="true" /><h1>Completing secure sign-in</h1><p role="status">Verifying the callback and restoring your session…</p></>}
  </main>;
}
