/**
 * 🚨 CANONICAL FILE — DO NOT MODIFY 🚨
 * 
 * 🔒 ROUTE PROTECTION MIDDLEWARE
 * 
 * RULES:
 * 1. Block legacy routes → redirect to /dashboard
 * 2. Protected routes without auth → redirect to /login?return_to=...
 * 3. NEVER redirect to /
 * 4. NO plan-based routing
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/recorder', '/checkout'];

// Legacy routes to block
const LEGACY_ROUTES = ['/record/pro', '/record-old', '/recorder-pro', '/dashboard-old'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ❌ Block legacy routes - redirect to /dashboard
  if (LEGACY_ROUTES.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Create Supabase client to check auth
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // If not authenticated, redirect to login with return_to param
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('return_to', pathname);
      return NextResponse.redirect(url);
    }

    return response;
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
    '/checkout',
    '/checkout/:path*',
    '/record/:path*',
    '/record-old/:path*',
    '/recorder-pro/:path*',
    '/dashboard-old/:path*',
  ],
};
