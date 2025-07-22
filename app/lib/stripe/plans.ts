// app/lib/stripe/plans.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Development bypass configuration - bypass in non-production or when explicitly enabled
const isDevelopment = process.env.NODE_ENV !== 'production';
const forceDevBypass = process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === 'true';
const DEV_BYPASS = isDevelopment || forceDevBypass;
const DEV_EMAILS = ['caresim360@gmail.com'];

// Log environment for debugging
console.log('[DEV] Plan Check Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  isDevelopment,
  forceDevBypass,
  DEV_BYPASS,
  NEXT_PUBLIC_ENABLE_DEV_BYPASS: process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS,
  timestamp: new Date().toISOString()
});

interface PlanLimits {
  canProceed: boolean;
  error?: string;
  remainingMinutes?: number;
}

/**
 * Check if a user can record based on their plan and usage
 * Includes development bypasses and dev account exceptions
 */
export async function canUserRecord(
  userId: string, 
  recordingDuration = 0
): Promise<PlanLimits> {
  console.debug('[DEBUG] canUserRecord called for', userId, 'duration:', recordingDuration);

  // 🚨 DEVELOPMENT BYPASS: Skip all checks in non-production or when explicitly enabled
  if (DEV_BYPASS) {
    try {
      // Try to get user email for better debugging
      let userEmail = 'no-email';
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();
          
        if (!error && userData) {
          userEmail = userData.email || 'no-email';
        }
      } catch (error) {
        console.warn('Failed to fetch user email:', error);
      }
      const isDevEmail = DEV_EMAILS.includes(userEmail);
      
      console.log('[DEV] Bypassing plan checks:', {
        userId,
        userEmail,
        isDevEmail,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      
      return {
        canProceed: true,
        remainingMinutes: 9999
      };
    } catch (error) {
      console.error('[DEV] Error in bypass check, still allowing:', error);
      return {
        canProceed: true,
        remainingMinutes: 9999
      };
    }
  }

  try {
    // Get user's email for dev account check
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // 🚨 DEV ACCOUNT EXCEPTION: Always allow recording for dev accounts
    if (userData?.email && DEV_EMAILS.includes(userData.email)) {
      console.debug(`[DEV] Allowing recording for dev account: ${userData.email}`);
      return {
        canProceed: true,
        remainingMinutes: 9999
      };
    }

    // Get user's plan and current usage
    const { data: plan, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !plan) {
      console.error('Plan fetch error:', error?.message || 'No plan found');
      return {
        canProceed: false,
        error: 'No active subscription found. Please upgrade your plan.'
      };
    }

    // Calculate remaining minutes
    const { data: usage } = await supabase
      .from('usage')
      .select('minutes_used')
      .eq('user_id', userId)
      .gte('created_at', plan.current_period_start)
      .lte('created_at', plan.current_period_end);

    const totalUsed = usage?.reduce((sum, row) => sum + (row.minutes_used || 0), 0) || 0;
    const recordingMinutes = Math.ceil(recordingDuration / 60);
    const remainingMinutes = Math.max(0, (plan.whisper_minutes_limit || 0) - totalUsed);

    if (recordingMinutes > remainingMinutes) {
      return {
        canProceed: false,
        error: `Your plan limit is reached. You have ${remainingMinutes} minutes remaining, but this recording is ${recordingMinutes} minutes.`,
        remainingMinutes
      };
    }

    return {
      canProceed: true,
      remainingMinutes: remainingMinutes - recordingMinutes
    };
  } catch (error) {
    console.error('Error in canUserRecord:', error);
    // Fail open in development, closed in production
    return {
      canProceed: DEV_BYPASS,
      error: 'An error occurred while verifying your plan. Please try again.'
    };
  }
}

/**
 * Update user's usage after recording
 * In development, this will only log the usage
 */
export async function updateUsage(
  userId: string, 
  minutes: number, 
  recordingId?: string
): Promise<void> {
  try {
    if (DEV_BYPASS) {
      console.debug(`[DEV] Would log ${minutes} minutes for user ${userId}`, 
        recordingId ? `(recording: ${recordingId})` : '');
      return;
    }

    const { error } = await supabase
      .from('usage')
      .insert({
        user_id: userId,
        minutes_used: minutes,
        recording_id: recordingId || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating usage:', error);
      // Don't throw to prevent breaking the main flow
    } else {
      console.log(`✅ Logged ${minutes} minutes for user ${userId}`);
    }
  } catch (error) {
    console.error('Unexpected error in updateUsage:', error);
  }
}
