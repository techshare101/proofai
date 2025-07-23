// Re-export from supabaseClient.ts with default export for backward compatibility
export { getCurrentUser, getSession } from './supabaseClient';
import { supabase } from './supabaseClient';

export default supabase;
