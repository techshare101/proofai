'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Debug log for state changes
  useEffect(() => {
    console.log('🔍 Auth state:', {
      session: session ? 'exists' : 'null',
      isLoading,
      isRedirecting,
      pathname
    });
  }, [session, isLoading, isRedirecting, pathname]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (isLoading) {
      console.log('⏳ Still loading, skipping redirect');
      return;
    }

    if (isRedirecting) {
      console.log('🔄 Already redirecting, skipping');
      return;
    }

    const handleAuthRedirect = async () => {
      if (session) {
        // If user is logged in and on auth pages, redirect to dashboard
        if (['/login', '/signup', '/'].includes(pathname)) {
          console.log('🎯 User logged in on auth page, redirecting to dashboard');
          setIsRedirecting(true);
          try {
            await router.push('/dashboard');
          } catch (err) {
            console.error('❌ Redirect error:', err);
          } finally {
            setIsRedirecting(false);
          }
        } else {
          console.log('✅ User logged in on allowed page:', pathname);
        }
      } else {
        // If not authenticated and trying to access protected routes
        if (pathname.startsWith('/dashboard')) {
          console.log('🔒 Unauthenticated user on protected route, redirecting to home');
          setIsRedirecting(true);
          try {
            await router.push('/');
          } catch (err) {
            console.error('❌ Redirect error:', err);
          } finally {
            setIsRedirecting(false);
          }
        } else {
          console.log('✅ Unauthenticated user on allowed page:', pathname);
        }
      }
    };

    handleAuthRedirect();
  }, [session, pathname, isLoading, router, isRedirecting]);

  // Initialize auth and handle session changes
  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          return;
        }

        if (!mounted) return;

        if (session) {
          console.log('✅ Session retrieved:', session.user?.email);
          setSession(session);
        } else {
          console.log('⚠️ No session found');
          setSession(null);
        }
      } catch (err) {
        console.error('❌ Session error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔁 Auth state changed:', event, session ? session.user?.email : 'no session');
      
      if (!mounted) return;

      if (event === 'SIGNED_IN') {
        console.log('🎉 User signed in');
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state during initial load
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="h-12 w-12 border-2 border-indigo-500 rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    session: context.session,
    isLoading: context.isLoading,
    user: context.session?.user ?? null,
  };
};
