'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  
  if (!cachedClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.error('Missing Supabase environment variables');
      return null;
    }
    
    cachedClient = createBrowserClient(url, key);
  }
  
  return cachedClient;
}

export function useSupabase() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      setClient(supabase);
    }
  }, []);
  
  return client;
}

// For immediate use in event handlers (not hooks)
export function getSupabase(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not available');
  }
  return client;
}
