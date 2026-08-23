import { LoaderCircle } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function AuthLoading() {
  return <main className="co-public co-auth-state"><LoaderCircle className="spin" aria-hidden="true" /><p role="status">Restoring secure session…</p></main>;
}

export function RequireAuthentication() {
  const { loading, session } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!session) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <Outlet />;
}

export function RequireWorkspaceAccess() {
  const { workspaceAccess } = useAuth();
  if (workspaceAccess !== 'authorized') return <Navigate to="/access-pending" replace />;
  return <Outlet />;
}
