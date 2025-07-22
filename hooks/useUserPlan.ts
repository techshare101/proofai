import { useState, useEffect } from 'react';
import { UserPlan } from '@/lib/stripe/plans';
import { config } from '@/lib/config';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useUserPlan() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setIsLoaded(true);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsLoaded(true);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);
  
  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        setLoading(true);
        
        // Check if we should use debug plan data
        const useDebugPlans = localStorage.getItem('useDebugPlans') === 'true';
        
        if (useDebugPlans) {
          const debugPlan = localStorage.getItem('debugPlan') || 'self_defender';
          const debugData: UserPlan = {
            user_id: user.id,
            plan: debugPlan as any,
            whisper_minutes_limit: 120, // Default debug value
            whisper_minutes_used: 0,
            billing_period_start: new Date().toISOString(),
            billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            updated_at: new Date().toISOString(),
          };
          setPlan(debugData);
          return;
        }
        
        // Otherwise, fetch real plan data
        const response = await fetch('/api/user/plan');
        if (!response.ok) {
          throw new Error('Failed to fetch plan');
        }
        const data = await response.json();
        setPlan(data);
      } catch (err) {
        console.error('Error fetching user plan:', err);
        setError('Failed to load plan information');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
    
    // Listen for storage events to update plan when debug settings change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'useDebugPlans' || e.key === 'debugPlan') {
        fetchPlan();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, isLoaded]);

  const refreshPlan = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch('/api/user/plan');
      if (!response.ok) {
        throw new Error('Failed to refresh plan');
      }
      const data = await response.json();
      setPlan(data);
      return data;
    } catch (err) {
      console.error('Error refreshing plan:', err);
      setError('Failed to refresh plan information');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    plan,
    loading,
    error,
    refreshPlan,
    isFreePlan: plan?.plan === 'starter',
    remainingMinutes: plan ? Math.max(0, plan.whisper_minutes_limit - plan.whisper_minutes_used) : 0,
    usagePercentage: plan && plan.whisper_minutes_limit > 0 
      ? Math.min(100, Math.round((plan.whisper_minutes_used / plan.whisper_minutes_limit) * 100))
      : 0,
  };
}
