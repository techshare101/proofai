import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from './supabaseClient';

// Re-export client-side supabase instance
export { supabase };

export const getServerSupabase = () => {
  const cookieStore = cookies();
  const cookieString = cookieStore.toString();
  
  // Create a minimal context object that matches what createPagesServerClient expects
  const context = {
    req: {
      headers: new Headers({
        cookie: cookieString
      })
    },
    res: {
      setHeader: () => {},
      getHeader: () => null,
      setCookie: () => {}
    }
  };

  return createPagesServerClient(
    context as any, // We need to cast to any due to Next.js internal types
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    }
  );
};

// Re-export other utilities from supabaseClient
export { getCurrentUser, getSession } from './supabaseClient';

export default supabase;
