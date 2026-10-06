import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { callbackUrl } from './routeSecurity';
import { ApiError, configureApiAuth, getAppSession, type WorkspaceMembership } from '../lib/api';
import { getSupabaseBrowserClient, isGoogleAuthEnabled } from '../lib/supabase';

export type WorkspaceRole = WorkspaceMembership['role'];
// idle: no identity. loading: asking the backend. authorized/unauthorized: the
// backend answered. unavailable: the backend could not answer, access stays closed.
export type WorkspaceStatus = 'idle' | 'loading' | 'authorized' | 'unauthorized' | 'unavailable';

type WorkspaceState = { status: WorkspaceStatus; workspaces: WorkspaceMembership[]; active: WorkspaceMembership | null };
const NO_WORKSPACE: WorkspaceState = { status: 'idle', workspaces: [], active: null };
const PRIMARY_WORKSPACE = 'cornerops-ai';

type AuthContextValue = {
  configured: boolean;
  googleEnabled: boolean;
  loading: boolean;
  session: Session | null;
  workspace: WorkspaceState;
  completeAuthCallback: (code: string) => Promise<void>;
  refreshWorkspace: () => void;
  sendMagicLink: (email: string, next: string) => Promise<void>;
  signInWithGoogle: (next: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, client }: { children: ReactNode; client?: SupabaseClient | null }) {
  const authClient = client === undefined ? getSupabaseBrowserClient() : client;
  const [loading, setLoading] = useState(Boolean(authClient));
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(NO_WORKSPACE);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const authRevision = useRef(0);
  const authOperationInFlight = useRef(false);
  const accessToken = useRef<string | null>(null);
  const activeSlug = useRef<string | null>(null);

  accessToken.current = session?.access_token ?? null;
  activeSlug.current = workspace.active?.slug ?? null;

  useEffect(() => {
    configureApiAuth({ accessToken: () => accessToken.current, workspaceSlug: () => activeSlug.current });
    return () => configureApiAuth({ accessToken: () => null, workspaceSlug: () => null });
  }, []);

  useEffect(() => {
    if (!authClient) {
      setLoading(false);
      setSession(null);
      return;
    }

    let active = true;
    if (!authOperationInFlight.current) {
      const bootstrapRevision = authRevision.current;
      void authClient.auth.getSession().then(({ data, error }) => {
        if (!active || bootstrapRevision !== authRevision.current) return;
        setSession(error ? null : data.session);
        setLoading(false);
      });
    }
    const { data: listener } = authClient.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      authRevision.current += 1;
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [authClient]);

  // Identity alone never grants access: membership is asked from the backend
  // for every new identity, and any failure keeps the workspace closed.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!userId || !accessToken.current) {
      setWorkspace(NO_WORKSPACE);
      return;
    }
    let active = true;
    setWorkspace({ ...NO_WORKSPACE, status: 'loading' });
    void getAppSession(accessToken.current)
      .then((result) => {
        if (!active) return;
        const workspaces = result.workspaces ?? [];
        const selected = workspaces.find((item) => item.slug === PRIMARY_WORKSPACE) ?? workspaces[0] ?? null;
        setWorkspace({ status: selected ? 'authorized' : 'unauthorized', workspaces, active: selected });
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          // The backend no longer accepts this session: drop it locally.
          void authClient?.auth.signOut({ scope: 'local' }).catch(() => undefined);
          setSession(null);
          setWorkspace(NO_WORKSPACE);
          return;
        }
        setWorkspace({ ...NO_WORKSPACE, status: 'unavailable' });
      });
    return () => { active = false; };
  }, [authClient, userId, workspaceRevision]);

  const requireClient = useCallback(() => {
    if (!authClient) throw new Error('Authentication is not configured for this environment.');
    return authClient;
  }, [authClient]);

  const completeAuthCallback = useCallback(async (code: string) => {
    authOperationInFlight.current = true;
    authRevision.current += 1;
    try {
      const { data, error } = await requireClient().auth.exchangeCodeForSession(code);
      if (error || !data.session) throw error ?? new Error('No authenticated session was returned.');
      setSession(data.session);
      setLoading(false);
    } finally {
      authOperationInFlight.current = false;
    }
  }, [requireClient]);

  const sendMagicLink = useCallback(async (email: string, next: string) => {
    const { error } = await requireClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl(next),
        shouldCreateUser: false,
      },
    });
    if (error) throw error;
  }, [requireClient]);

  const signInWithGoogle = useCallback(async (next: string) => {
    if (!isGoogleAuthEnabled()) throw new Error('Google authentication is not enabled for this environment.');
    const { error } = await requireClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) throw error;
  }, [requireClient]);

  const signOut = useCallback(async () => {
    authRevision.current += 1;
    const { error } = await requireClient().auth.signOut({ scope: 'local' });
    if (error) throw error;
    try { sessionStorage.removeItem('cornerops-console-token'); } catch { /* storage unavailable */ }
    setSession(null);
    setWorkspace(NO_WORKSPACE);
  }, [requireClient]);

  const refreshWorkspace = useCallback(() => setWorkspaceRevision((value) => value + 1), []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(authClient),
    googleEnabled: Boolean(authClient) && isGoogleAuthEnabled(),
    loading,
    session,
    workspace,
    completeAuthCallback,
    refreshWorkspace,
    sendMagicLink,
    signInWithGoogle,
    signOut,
  }), [authClient, completeAuthCallback, loading, refreshWorkspace, sendMagicLink, session, signInWithGoogle, signOut, workspace]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
