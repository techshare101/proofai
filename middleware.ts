import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object that we'll manipulate
  let response = NextResponse.next();
  
  // Set request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);
  
  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Get session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if the route is protected
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';
  
  // Handle protected routes
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect to dashboard if user is already authenticated and trying to access auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Update request headers
  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page
     * - signup page
     */
    '/((?!_next/static|_next/image|favicon.ico|login|signup).*)',
  ],
};
