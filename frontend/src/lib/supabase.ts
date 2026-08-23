import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null | undefined;

export function isSupabaseAuthConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim()
    && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}

export function isGoogleAuthEnabled() {
  return import.meta.env.VITE_SUPABASE_GOOGLE_AUTH_ENABLED === 'true';
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  if (!isSupabaseAuthConfigured()) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
      },
    },
  );
  return browserClient;
}
