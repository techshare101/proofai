'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AuthContextType {
  user: any;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null,
  isLoading: true,
  hasActiveSubscription: false,
  refreshSubscription: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkSubscription = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_active_subscription')
      .eq('id', userId)
      .single()
    
    setHasActiveSubscription(profile?.has_active_subscription || false)
    return profile?.has_active_subscription || false
  }

  const refreshSubscription = async () => {
    if (user?.id) {
      await checkSubscription(user.id)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        const hasSubscription = await checkSubscription(session.user.id)
        
        // If on dashboard without subscription, redirect to pricing
        if (pathname.startsWith('/dashboard') && !hasSubscription) {
          router.replace('/pricing')
          return
        }
      } else {
        setUser(null)
        setHasActiveSubscription(false)
      }
      
      setLoading(false)
    }

    checkUser()

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await checkSubscription(session.user.id)
        } else {
          setUser(null)
          setHasActiveSubscription(false)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [pathname, router, supabase])

  // Handle redirects based on auth state
  useEffect(() => {
    if (loading) return
    
    const publicPaths = ['/', '/login', '/signup', '/pricing', '/auth/callback']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    // Redirect to login if not authenticated and not on a public path
    if (!user && !isPublicPath) {
      router.replace('/login')
      return
    }
    
    // Redirect away from auth pages if already authenticated
    if (user && isPublicPath && !pathname.startsWith('/pricing')) {
      // Only redirect to dashboard if they have an active subscription
      const targetPath = hasActiveSubscription ? '/dashboard' : '/pricing'
      if (pathname !== targetPath) {
        router.replace(targetPath)
      }
    }
  }, [user, loading, pathname, hasActiveSubscription, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading: loading, 
      hasActiveSubscription,
      refreshSubscription 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
