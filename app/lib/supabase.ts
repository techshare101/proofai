import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const getSupabaseClient = () => {
  // Get environment variables based on runtime context
  const isServer = typeof window === 'undefined';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = isServer 
    ? process.env.SUPABASE_SERVICE_KEY // Use service key for server
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use anon key for client

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing environment variables: ' +
      (!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : '') +
      (!supabaseKey ? (isServer ? 'SUPABASE_SERVICE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY') : '')
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: !isServer,
      autoRefreshToken: true,
      detectSessionInUrl: !isServer
    }
  });
};

export const supabase = getSupabaseClient();
