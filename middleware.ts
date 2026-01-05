/**
 * 🔒 ROUTE PROTECTION MIDDLEWARE
 * Blocks legacy routes and ensures single app entry point.
 * DO NOT add plan-based routing here.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ❌ Block legacy recorder routes - redirect to new recorder
  if (
    pathname.startsWith('/record/pro') ||
    pathname.startsWith('/record-old') ||
    pathname.startsWith('/recorder-pro') ||
    pathname.startsWith('/dashboard-old')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/recorder',
    '/recorder/:path*',
    '/record/:path*',
    '/record-old/:path*',
    '/recorder-pro/:path*',
    '/dashboard-old/:path*',
  ],
};
