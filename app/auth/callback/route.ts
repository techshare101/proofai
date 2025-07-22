export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import supabase from '../../lib/supabase';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';

    if (!code) {
      console.error('No code in callback');
      return NextResponse.redirect(`${requestUrl.origin}?error=no_code`);
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(`${requestUrl.origin}?error=${error.message}`);
    }

    // Check if this is a new user (just confirmed email)
    const isNewUser = data?.user?.confirmed_at && 
                     data.user.created_at === data.user.updated_at;

    // Redirect to pricing page for new users, otherwise to the intended destination
    const redirectPath = isNewUser ? '/pricing' : next;
    
    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${new URL(request.url).origin}?error=callback_error`);
  }
}
