'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
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

  // Initialize auth and handle session changes
  // Hardened: prevents duplicate listeners, stale state, and auth loss during upload
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
        }
        
        if (data?.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Handle auth redirects
  useEffect(() => {
    if (isLoading) return;

    // Allow unauthenticated users to stay on the landing page ('/')
    if (!session && pathname !== '/login' && pathname !== '/') {
      router.push('/login');
    }

    if (session && (pathname === '/' || pathname === '/login')) {
      router.push('/dashboard');
    }
  }, [session, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
