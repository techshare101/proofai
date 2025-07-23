'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus?: string;
  subscriptionStatusDetail?: string;
  currentPlan?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}

interface AuthContextType {
  user: any;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  subscription: SubscriptionStatus | null;
  refreshSubscription: () => Promise<SubscriptionStatus | null>;
}

const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: true,
  hasActiveSubscription: false,
  subscription: null,
  refreshSubscription: async () => null
}

const AuthContext = createContext<AuthContextType>(defaultContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  
  const hasActiveSubscription = subscription?.hasActiveSubscription || false
  const router = useRouter()
  const pathname = usePathname()

  const checkSubscription = async (userId: string): Promise<SubscriptionStatus> => {
    try {
      // Check the user_subscription_status table
      const { data: subscriptionStatus, error } = await supabase
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      // Use upsert to handle both insert and update cases
      const initialStatus: SubscriptionStatus = {
        hasActiveSubscription: false,
        subscriptionStatus: 'inactive',
        subscriptionStatusDetail: 'inactive',
        currentPlan: 'free',
        cancelAtPeriodEnd: false
      }
      
      if (error?.code === 'PGRST116') {
        console.log('Creating or updating subscription status record for user:', userId)
        const { data: newStatus, error: upsertError } = await supabase
          .from('user_subscription_status')
          .upsert(
            { 
              user_id: userId,
              has_active_subscription: false,
              subscription_status: 'inactive',
              subscription_status_detail: 'inactive',
              current_plan: 'free',
              cancel_at_period_end: false,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single()
          
        if (upsertError) {
          console.error('Error upserting subscription status:', upsertError)
        }
        
        setSubscription(initialStatus)
        return initialStatus
      }
      
      if (error) {
        console.error('Error checking subscription status:', error)
        throw error
      }
      
      // Map the subscription status to our interface
      const subscriptionData: SubscriptionStatus = {
        hasActiveSubscription: subscriptionStatus.has_active_subscription || false,
        subscriptionStatus: subscriptionStatus.subscription_status || 'inactive',
        subscriptionStatusDetail: subscriptionStatus.subscription_status_detail || 'inactive',
        currentPlan: subscriptionStatus.current_plan || 'free',
        stripeCustomerId: subscriptionStatus.stripe_customer_id,
        stripePriceId: subscriptionStatus.stripe_price_id,
        currentPeriodEnd: subscriptionStatus.stripe_current_period_end,
        cancelAtPeriodEnd: subscriptionStatus.cancel_at_period_end || false
      }
      
      setSubscription(subscriptionData)
      return subscriptionData
    } catch (error) {
      console.error('Error in checkSubscription:', error)
      const errorStatus: SubscriptionStatus = {
        hasActiveSubscription: false,
        subscriptionStatus: 'error',
        subscriptionStatusDetail: 'error',
        currentPlan: 'free',
        cancelAtPeriodEnd: false
      }
      setSubscription(errorStatus)
      return errorStatus
    }
  }

  const refreshSubscription = async (): Promise<SubscriptionStatus | null> => {
    if (user?.id) {
      return checkSubscription(user.id)
    }
    return null
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
        setSubscription(null)
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
          setSubscription(null)
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
      subscription,
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
