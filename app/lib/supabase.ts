import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing environment variables: ' +
    (!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : '') +
    (!supabaseKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : '')
  );
}

// Create a Supabase client with the anon key for client-side usage
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Create a server-side client with the service key for API routes
export const getServerSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
