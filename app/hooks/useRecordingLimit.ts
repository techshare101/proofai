'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkRecordingLimit, RecordingLimitStatus } from '../lib/plans/checkRecordingLimit';
import { isDevBypassEnabled } from '../lib/plans/getUserPlan';

const DEFAULT_STATUS: RecordingLimitStatus = {
  canRecord: true,
  used: 0,
  limit: 3,
  remaining: 3,
  planType: 'starter',
  isUnlimited: false,
};

export function useRecordingLimit() {
  const { session } = useAuth();
  const [status, setStatus] = useState<RecordingLimitStatus>(() => {
    // Dev bypass - instant unlimited
    if (isDevBypassEnabled()) {
      return {
        canRecord: true,
        used: 0,
        limit: Infinity,
        remaining: Infinity,
        planType: 'pro',
        isUnlimited: true,
      };
    }
    return DEFAULT_STATUS;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setStatus(DEFAULT_STATUS);
      setIsLoading(false);
      return;
    }

    try {
      const result = await checkRecordingLimit(session.user.id);
      setStatus(result);
    } catch (err) {
      console.error('Error checking recording limit:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...status,
    isLoading,
    refresh, // Call after successful recording to update count
  };
}
