import { createClient } from "@supabase/supabase-js";

// Client-side singleton instance
let clientInstance: ReturnType<typeof createClient> | null = null;

// ✅ Safe for client-side usage (uses public anon key)
export function getAnonSupabaseClient() {
  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
  }

  if (typeof window !== 'undefined') {
    clientInstance = createClient(url, key);
    return clientInstance;
  }
  
  return createClient(url, key);
}

// ✅ Server-only usage (e.g., in API routes or server components)
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SERVICE_KEY");
  }

  return createClient(url, key);
}



