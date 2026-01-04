import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized browser client singleton
let browserClient: SupabaseClient | null = null;

// Get browser client (lazy initialization to avoid build-time errors)
export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Return a dummy client for SSR that will be replaced on client
    return {} as SupabaseClient;
  }
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

// Export default as a proxy that lazy-initializes
const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      // During SSR, return no-op functions for auth
      if (prop === 'auth') {
        return {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: () => Promise.resolve({ data: null, error: null }),
          signOut: () => Promise.resolve({ error: null }),
        };
      }
      return () => Promise.resolve({ data: null, error: null });
    }
    const client = getBrowserSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export default supabase;

// ✅ Server-only usage (e.g., in API routes or server components)
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SERVICE_KEY");
  }

  return createClient(url, key);
}

// For API routes that use getServerSupabase
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or ANON_KEY for server supabase");
  }

  return createClient(url, key);
}
