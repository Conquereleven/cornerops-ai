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
import { getSupabaseBrowserClient, isGoogleAuthEnabled } from '../lib/supabase';

export type WorkspaceAccess = 'pending' | 'authorized';

type AuthContextValue = {
  configured: boolean;
  googleEnabled: boolean;
  loading: boolean;
  session: Session | null;
  workspaceAccess: WorkspaceAccess;
  completeAuthCallback: (code: string) => Promise<void>;
  sendMagicLink: (email: string, next: string) => Promise<void>;
  signInWithGoogle: (next: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, client }: { children: ReactNode; client?: SupabaseClient | null }) {
  const authClient = client === undefined ? getSupabaseBrowserClient() : client;
  const [loading, setLoading] = useState(Boolean(authClient));
  const [session, setSession] = useState<Session | null>(null);
  const authRevision = useRef(0);
  const authOperationInFlight = useRef(false);

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
    setSession(null);
  }, [requireClient]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(authClient),
    googleEnabled: Boolean(authClient) && isGoogleAuthEnabled(),
    loading,
    session,
    // CO-WEB-1F owns workspace membership. Identity alone must never authorize access.
    workspaceAccess: 'pending',
    completeAuthCallback,
    sendMagicLink,
    signInWithGoogle,
    signOut,
  }), [authClient, completeAuthCallback, loading, sendMagicLink, session, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
