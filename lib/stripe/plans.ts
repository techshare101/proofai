import { PLANS, PlanName } from './config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserPlan {
  user_id: string;
  plan: PlanName;
  whisper_minutes_limit: number;
  whisper_minutes_used: number;
  billing_period_start: string;
  billing_period_end: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at?: string;
  updated_at: string;
}

export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  try {
    const { data: plan, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !plan) {
      // Return default starter plan if no plan found
      return {
        user_id: userId,
        plan: 'starter',
        whisper_minutes_limit: PLANS.STARTER.whisperMinutesLimit,
        whisper_minutes_used: 0,
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'active',
        updated_at: new Date().toISOString(),
      };
    }

    return plan as UserPlan;
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return null;
  }
}

export async function canUserRecord(userId: string, recordingDurationSeconds: number): Promise<{
  canRecord: boolean;
  reason?: string;
  plan: UserPlan;
  remainingMinutes: number;
}> {
  const plan = await getUserPlan(userId);
  if (!plan) {
    return {
      canRecord: false,
      reason: 'Could not determine your plan. Please try again later.',
      plan: {
        user_id: userId,
        plan: 'starter',
        whisper_minutes_limit: 0,
        whisper_minutes_used: 0,
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      remainingMinutes: 0,
    };
  }

  const recordingMinutes = Math.ceil(recordingDurationSeconds / 60);
  const remainingMinutes = Math.max(0, plan.whisper_minutes_limit - plan.whisper_minutes_used);

  // Check if user is on a paid plan
  if (plan.plan === 'starter') {
    return {
      canRecord: false,
      reason: 'Your current plan does not include transcription. Please upgrade to a paid plan.',
      plan,
      remainingMinutes: 0,
    };
  }

  // Check if user has exceeded their monthly limit
  if (plan.whisper_minutes_used >= plan.whisper_minutes_limit) {
    return {
      canRecord: false,
      reason: 'You have used all your monthly transcription minutes. Please upgrade your plan or wait until your next billing cycle.',
      plan,
      remainingMinutes: 0,
    };
  }

  // Check if this recording would exceed the limit
  if (recordingMinutes > remainingMinutes) {
    return {
      canRecord: false,
      reason: `This recording would exceed your monthly limit. You have ${remainingMinutes} minutes remaining.`,
      plan,
      remainingMinutes,
    };
  }

  return {
    canRecord: true,
    plan,
    remainingMinutes: remainingMinutes - recordingMinutes,
  };
}

export async function updateUsage(
  userId: string, 
  recordingDurationSeconds: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const recordingMinutes = Math.ceil(recordingDurationSeconds / 60);
    
    // Get current plan
    const plan = await getUserPlan(userId);
    if (!plan) {
      return { success: false, error: 'Could not find user plan' };
    }

    // Update usage in the database
    const { error } = await supabase.rpc('increment_usage', {
      user_id: userId,
      minutes_used: recordingMinutes,
    });

    if (error) {
      console.error('Error updating usage:', error);
      return { success: false, error: 'Failed to update usage' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUsage:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
