import { createClient } from "@supabase/supabase-js";

// ✅ Safe for client-side usage (uses public anon key)
export function getAnonSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
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



