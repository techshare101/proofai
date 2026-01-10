/**
 * 🔒 AUTH CONTEXT - Session state only
 * 
 * RULES:
 * ❌ NO redirect logic here (handled by middleware)
 * ❌ NO plan checks
 * ❌ NO route-based decisions
 * 
 * ✅ Only provides session state to components
 */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
          // Handle invalid refresh token by signing out
          if (error.message?.includes('Refresh Token') || 
              error.message?.includes('refresh_token') ||
              error.name === 'AuthApiError') {
            console.warn('Invalid refresh token detected, signing out...');
            await supabase.auth.signOut();
            setSession(null);
          }
        }
        
        if (data?.session) {
          setSession(data.session);
        }
      } catch (err: any) {
        console.error('Session init error:', err);
        // Handle auth errors by clearing session
        if (err?.message?.includes('Refresh Token') || err?.name === 'AuthApiError') {
          console.warn('Auth error detected, clearing session...');
          await supabase.auth.signOut();
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, signing out...');
          await supabase.auth.signOut();
          setSession(null);
          return;
        }
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          setSession(null);
          return;
        }
        
        setSession(session);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ❌ REMOVED: Auth redirect logic
  // Redirects are now handled by middleware.ts
  // This context only provides session state

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
