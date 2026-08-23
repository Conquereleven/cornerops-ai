import { LogOut, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/public.css';

export function AccessPending() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
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
    <span className="co-public-eyebrow">Authenticated · access pending</span>
    <h1>Workspace access has not been granted</h1>
    <p>Your identity was verified{session?.user.email ? ` for ${session.user.email}` : ''}, but authentication does not grant access to any CornerOps workspace.</p>
    <p>Workspace membership and roles remain a separate, fail-closed gate owned by CO-WEB-1F.</p>
    {error && <p role="alert" className="co-auth-error">{error}</p>}
    <button className="co-public-secondary" type="button" onClick={() => void logout()}><LogOut size={15} /> Sign out</button>
  </main>;
}
