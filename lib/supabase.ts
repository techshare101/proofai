import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Re-export from supabaseClient.ts with default export for backward compatibility
export { getCurrentUser, getSession } from './supabaseClient';
import { supabase } from './supabaseClient';

// For server-side usage
export const getServerSupabase = () => {
  return createPagesServerClient(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    }
  );
};

export default supabase;
