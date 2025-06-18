import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Function to create a client-side Supabase client
function createSupabaseClient() {
  // Only warn during runtime, not during build
  if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
    console.error(
      'Missing environment variables: ' +
      (!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : '') +
      (!supabaseKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : '')
    );
  }

  // Fallback to empty strings during build so SSG doesn't fail
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

// Create a Supabase client with the anon key for client-side usage
export const supabase = createSupabaseClient();

// Create a server-side client with the service key for API routes
export const getServerSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  // Only throw if actually trying to use the client at runtime
  if (!serviceKey) {
    console.error('Missing SUPABASE_SERVICE_KEY environment variable');
    throw new Error('Missing Supabase environment variables');
  }

  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};
