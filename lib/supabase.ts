import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// Client-side Supabase client using createPagesBrowserClient
export const supabase = createPagesBrowserClient();

// Re-export other utilities from supabaseClient
export { getCurrentUser, getSession } from './supabaseClient';

export default supabase;
