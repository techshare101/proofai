import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side operations.
 * This should only be used in Server Components, API routes, or server actions.
 */
export const createServerSupabase = () => {
  return createPagesServerClient({
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookies().set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookies().set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
};

// Alias for backward compatibility
export const getServerSupabase = createServerSupabase;
