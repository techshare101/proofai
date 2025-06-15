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
    if (!isLoading && !isRedirecting) {
      const handleAuthRedirect = async () => {
        if (session && ['/login', '/signup', '/'].includes(pathname)) {
          setIsRedirecting(true);
          try {
            await router.replace('/dashboard');
          } catch (err) {
            console.error('Redirect error:', err);
          } finally {
            setIsRedirecting(false);
          }
        } else if (!session && pathname.startsWith('/dashboard')) {
          setIsRedirecting(true);
          try {
            await router.replace('/login');
          } catch (err) {
            console.error('Redirect error:', err);
          } finally {
            setIsRedirecting(false);
          }
        }
      };

      handleAuthRedirect();
    }
  }, [session, pathname, isLoading, router, isRedirecting]);

  // Initialize auth and handle session changes
  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setSession(session);
      } catch (err) {
        console.error('Session error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
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
