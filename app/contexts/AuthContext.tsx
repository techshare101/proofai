'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('AuthProvider: Initializing...');

      // Get initial session
      console.log('AuthProvider: Getting initial session...');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Session error:', error);
          setError(error.message);
        } else {
          console.log('Session retrieved:', session ? 'logged in' : 'no session');
          setUser(session?.user ?? null);
        }
        setLoading(false);
      });

      // Listen for auth changes
      console.log('AuthProvider: Setting up auth listener...');
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('Auth state changed:', _event);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        console.log('AuthProvider: Cleaning up...');
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('AuthProvider error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
