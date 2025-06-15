export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';

    if (!code) {
      console.error('No code in callback');
      return NextResponse.redirect(`${requestUrl.origin}?error=no_code`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(`${requestUrl.origin}?error=${error.message}`);
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${new URL(request.url).origin}?error=callback_error`);
  }
}
