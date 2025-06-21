import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Create a single Supabase client for the entire application
// with proper authentication options
const supabase = createPagesBrowserClient();

// Export a consistent instance to avoid multiple GoTrueClient warnings
export default supabase;

// ✅ Server-only usage (e.g., in API routes or server components)
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SERVICE_KEY");
  }

  return createClient(url, key);
}

// For API routes that use getServerSupabase
export const getServerSupabase = getSupabaseClient;
