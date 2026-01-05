'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPlan, getDevBypassPlan, UserPlan } from '../lib/plans/getUserPlan';

const DEFAULT_PLAN: UserPlan = {
  plan: 'starter',
  status: 'inactive',
  source: 'default',
  limits: {
    recordingsPerMonth: 3,
    storageDays: 7,
    maxFileSizeMB: 25,
    videoQuality: 'standard',
    pdfExport: true,
    folders: true, // Allow folders for all users
    watermark: true,
    aiSummary: false,
    customBranding: false,
  },
};

export function useUserPlan() {
  const { session } = useAuth();
  const [plan, setPlan] = useState<UserPlan>(() => {
    // Check dev bypass immediately for instant UI
    const devPlan = getDevBypassPlan();
    return devPlan || DEFAULT_PLAN;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      // Dev bypass - no need to fetch
      const devPlan = getDevBypassPlan();
      if (devPlan) {
        setPlan(devPlan);
        setIsLoading(false);
        return;
      }

      if (!session?.user?.id) {
        setPlan(DEFAULT_PLAN);
        setIsLoading(false);
        return;
      }

      try {
        const userPlan = await getUserPlan(session.user.id);
        setPlan(userPlan);
      } catch (err) {
        console.error('Error fetching user plan:', err);
        setPlan(DEFAULT_PLAN);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, [session?.user?.id]);

  return {
    plan,
    isLoading,
    isPro: plan.plan !== 'starter' && plan.status === 'active',
    isDevBypass: plan.source === 'dev-bypass',
    limits: plan.limits,
  };
}
