/**
 * 🔒 AUTH CALLBACK - Single post-login redirect source of truth
 * 
 * REDIRECT RULE:
 * If return_to param exists → go there
 * Else → /dashboard
 * 
 * ❌ NEVER redirect to /
 * ❌ NEVER use plan logic
 * ❌ NEVER use legacy routes
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    // Single source of truth: return_to param or /dashboard (NEVER /)
    const returnTo = requestUrl.searchParams.get('return_to') || '/dashboard';

    if (!code) {
      console.error('No code in callback');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
    }

    // Create server-side Supabase client with cookie handling
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    // Single source of truth: use return_to or default to /dashboard
    console.log('🔐 Auth callback redirecting to:', returnTo);
    return NextResponse.redirect(`${requestUrl.origin}${returnTo}`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=callback_error`);
  }
}
