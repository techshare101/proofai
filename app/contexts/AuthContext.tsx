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
    try {
      // Check the user_subscription_status table
      const { data: subscriptionStatus, error } = await supabase
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Error checking subscription status:', error)
        
        // If the row doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newStatus } = await supabase
            .from('user_subscription_status')
            .insert([{ user_id: userId }])
            .select()
            .single()
          
          setHasActiveSubscription(false)
          return false
        }
        
        // Fallback to profiles table if there's another error
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_active_subscription')
          .eq('id', userId)
          .single()
        
        const isActive = profile?.has_active_subscription || false
        setHasActiveSubscription(isActive)
        return isActive
      }
      
      // Use the subscription status from the table
      const isActive = subscriptionStatus?.has_active_subscription || false
      setHasActiveSubscription(isActive)
      
      // If the subscription is active in profiles but not in the status table, update it
      if (!isActive) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_active_subscription')
          .eq('id', userId)
          .single()
        
        if (profile?.has_active_subscription) {
          await supabase
            .from('user_subscription_status')
            .update({ 
              has_active_subscription: true,
              subscription_status: 'active',
              subscription_updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
          
          setHasActiveSubscription(true)
          return true
        }
      }
      
      return isActive
    } catch (error) {
      console.error('Error in checkSubscription:', error)
      setHasActiveSubscription(false)
      return false
    }
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
    
    // If user is authenticated and has an active subscription
    if (user) {
      // If on pricing page but already has subscription, redirect to dashboard
      if (pathname === '/pricing' && hasActiveSubscription) {
        router.replace('/dashboard')
        return
      }
      
      // If on auth pages (except landing), redirect based on subscription status
      if (isPublicPath && !pathname.startsWith('/pricing') && pathname !== '/') {
        const targetPath = hasActiveSubscription ? '/dashboard' : '/pricing'
        if (pathname !== targetPath) {
          router.replace(targetPath)
        }
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
