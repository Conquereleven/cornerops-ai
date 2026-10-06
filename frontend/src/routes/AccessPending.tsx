import { LoaderCircle, LogOut, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/public.css';

export function AccessPending() {
  const { refreshWorkspace, signOut, workspace } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  if (workspace.status === 'authorized') return <Navigate to="/app" replace />;
  if (workspace.status === 'idle' || workspace.status === 'loading') return <main className="co-public co-auth-state"><LoaderCircle className="spin" aria-hidden="true" /><p role="status">Checking workspace access…</p></main>;
  const unavailable = workspace.status === 'unavailable';
  const logout = async () => {
    setError('');
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setError('Sign out could not be completed. Your access remains blocked.');
    }
  };
  return <main className="co-public co-auth-state">
    <ShieldAlert aria-hidden="true" />
    <span className="co-public-eyebrow">{unavailable ? 'Signed in · access not verified' : 'Signed in · no workspace access'}</span>
    <h1>{unavailable ? 'Workspace access could not be verified' : 'Workspace access has not been granted'}</h1>
    <p>{unavailable ? 'CornerOps could not reach the authorization service, so the workspace stays closed.' : 'Your identity was verified, but signing in does not grant access to a CornerOps workspace. An administrator has to add you as a member.'}</p>
    {error && <p role="alert" className="co-auth-error">{error}</p>}
    <button className="co-public-secondary" type="button" onClick={refreshWorkspace}>Check again</button>
    <button className="co-public-secondary" type="button" onClick={() => void logout()}><LogOut size={15} /> Sign out</button>
  </main>;
}
