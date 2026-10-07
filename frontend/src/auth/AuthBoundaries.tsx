import { LoaderCircle, ServerCrash } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type WorkspaceRole } from './AuthContext';
import '../styles/public.css';

const ROLE_ORDER: WorkspaceRole[] = ['viewer', 'operator', 'founder'];
export const roleAllows = (held: WorkspaceRole | undefined, required: WorkspaceRole) => (
  Boolean(held) && ROLE_ORDER.indexOf(held as WorkspaceRole) >= ROLE_ORDER.indexOf(required)
);

function AuthLoading({ label }: { label: string }) {
  return <main className="co-public co-auth-state"><LoaderCircle className="spin" aria-hidden="true" /><p role="status">{label}</p></main>;
}

function loginRedirect(pathname: string, search: string) {
  return `/login?next=${encodeURIComponent(`${pathname}${search}`)}`;
}

// Identity only. Used for the access-pending page.
export function RequireAuthentication() {
  const { loading, session } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading label="Restoring secure session…" />;
  if (!session) return <Navigate to={loginRedirect(location.pathname, location.search)} replace />;
  return <Outlet />;
}

// The private-app guard. Nothing below it renders until the backend has
// confirmed an active workspace membership for this identity.
export function ProtectedWorkspaceRoute() {
  const { loading, refreshWorkspace, session, workspace } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading label="Restoring secure session…" />;
  if (!session) return <Navigate to={loginRedirect(location.pathname, location.search)} replace />;
  if (workspace.status === 'idle' || workspace.status === 'loading') return <AuthLoading label="Checking workspace access…" />;
  if (workspace.status === 'unavailable') {
    return <main className="co-public co-auth-state">
      <ServerCrash aria-hidden="true" />
      <h1>Workspace access could not be verified</h1>
      <p role="alert">Corner Tech AI could not reach the authorization service, so the workspace stays closed. Nothing was loaded.</p>
      <button className="co-public-secondary" type="button" onClick={refreshWorkspace}>Try again</button>
    </main>;
  }
  if (workspace.status !== 'authorized' || !workspace.active) return <Navigate to="/access-pending" replace />;
  return <Outlet />;
}

// Module-level check for navigation clarity. The API enforces the same role.
export function RequireRole({ role, children }: { role: WorkspaceRole; children: React.ReactNode }) {
  const { workspace } = useAuth();
  if (!roleAllows(workspace.active?.role, role)) {
    return <div className="module-page"><section className="resource-error" role="alert"><div><strong>Not available for your role</strong><p>This area requires the {role} role in {workspace.active?.name ?? 'this workspace'}.</p></div></section></div>;
  }
  return <>{children}</>;
}
