import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session on every request
  await supabase.auth.getSession()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/auth/callback']
  
  // Allow access to public routes
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return res
  }

  // If no session and trying to access protected route → redirect to login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // For dashboard routes, check subscription status
  if (pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_active_subscription')
      .eq('id', session.user.id)
      .single()

    // If no active subscription, redirect to pricing
    if (!profile?.has_active_subscription) {
      const pricingUrl = new URL('/pricing', req.url)
      return NextResponse.redirect(pricingUrl)
    }
  }

  // If logged in and trying to access auth pages, redirect to dashboard
  if (session && publicPaths.includes(pathname) && pathname !== '/pricing') {
    const dashboardUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Match all pages except for static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
