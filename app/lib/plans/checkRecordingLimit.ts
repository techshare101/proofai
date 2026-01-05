import supabase from '../supabase';
import { getUserPlan, isDevBypassEnabled, PlanType } from './getUserPlan';

export interface RecordingLimitStatus {
  canRecord: boolean;
  used: number;
  limit: number;
  remaining: number;
  planType: PlanType;
  isUnlimited: boolean;
  message?: string;
}

export async function checkRecordingLimit(userId: string): Promise<RecordingLimitStatus> {
  // Dev bypass - always allow
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

  try {
    const plan = await getUserPlan(userId);
    const limit = plan.limits.recordingsPerMonth;

    // Unlimited plans
    if (limit === Infinity) {
      return {
        canRecord: true,
        used: 0,
        limit: Infinity,
        remaining: Infinity,
        planType: plan.plan,
        isUnlimited: true,
      };
    }

    // For emergency_pack, count ALL recordings (lifetime)
    // For other plans, count THIS MONTH only
    let used = 0;

    if (plan.plan === 'emergency_pack') {
      // Count total recordings ever
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      used = count || 0;
    } else {
      // Count recordings this calendar month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      used = count || 0;
    }

    const remaining = Math.max(0, limit - used);
    const canRecord = remaining > 0;

    return {
      canRecord,
      used,
      limit,
      remaining,
      planType: plan.plan,
      isUnlimited: false,
      message: canRecord 
        ? `${remaining} recording${remaining !== 1 ? 's' : ''} remaining this month`
        : `You've used all ${limit} recordings for this month`,
    };
  } catch (err) {
    console.error('Error checking recording limit:', err);
    // Fail open - allow recording but log error
    return {
      canRecord: true,
      used: 0,
      limit: 3,
      remaining: 3,
      planType: 'starter',
      isUnlimited: false,
      message: 'Unable to verify limit',
    };
  }
}
