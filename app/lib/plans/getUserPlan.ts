/**
 * 🚨 CANONICAL FILE — DO NOT MODIFY 🚨
 *
 * This file is production-locked.
 * Any changes will cause regressions.
 *
 * Allowed actions:
 *  - Read only
 *  - Import only
 *
 * DO NOT:
 *  - Refactor
 *  - Reformat
 *  - Rename
 *  - "Improve"
 *
 * Changes require explicit human approval.
 */
import supabase from '../supabase';

export type PlanType = 
  | 'starter'           // Free - $0/mo
  | 'community'         // $4.99/mo
  | 'self_defender'     // $9.99/mo (highlighted as "Pro")
  | 'emergency_pack'    // $14.99 one-time
  | 'mission_partner'   // $19.99/mo
  | 'pro';              // Dev bypass / legacy

export interface UserPlan {
  plan: PlanType;
  status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
  source: 'stripe' | 'dev-bypass' | 'default';
  limits: {
    recordingsPerMonth: number;
    storageDays: number;
    maxFileSizeMB: number;
    videoQuality: 'standard' | 'hd' | 'max';
    pdfExport: boolean;
    folders: boolean;
    watermark: boolean;
    aiSummary: boolean;
    customBranding: boolean;
  };
}

// Plan limits matching pricing page
const PLAN_LIMITS: Record<PlanType, UserPlan['limits']> = {
  starter: {
    recordingsPerMonth: 3,
    storageDays: 7,
    maxFileSizeMB: 25,
    videoQuality: 'standard',
    pdfExport: true,
    folders: true, // Allow folders for all users including starter
    watermark: true,
    aiSummary: false,
    customBranding: false,
  },
  community: {
    recordingsPerMonth: 15,
    storageDays: 30,
    maxFileSizeMB: 50,
    videoQuality: 'hd',
    pdfExport: true,
    folders: true,
    watermark: false,
    aiSummary: true,
    customBranding: false,
  },
  self_defender: {
    recordingsPerMonth: Infinity,
    storageDays: Infinity, // 100GB storage
    maxFileSizeMB: 500,
    videoQuality: 'max',
    pdfExport: true,
    folders: true,
    watermark: false,
    aiSummary: true,
    customBranding: true,
  },
  emergency_pack: {
    recordingsPerMonth: 10, // Total, not per month
    storageDays: Infinity, // Lifetime
    maxFileSizeMB: 500,
    videoQuality: 'max',
    pdfExport: true,
    folders: true,
    watermark: false,
    aiSummary: true,
    customBranding: true,
  },
  mission_partner: {
    recordingsPerMonth: Infinity,
    storageDays: Infinity,
    maxFileSizeMB: 500,
    videoQuality: 'max',
    pdfExport: true,
    folders: true,
    watermark: false,
    aiSummary: true,
    customBranding: true,
  },
  pro: {
    recordingsPerMonth: Infinity,
    storageDays: Infinity,
    maxFileSizeMB: 500,
    videoQuality: 'max',
    pdfExport: true,
    folders: true,
    watermark: false,
    aiSummary: true,
    customBranding: true,
  },
};

export async function getUserPlan(userId: string): Promise<UserPlan> {
  // Dev bypass - full Pro access in development
  if (
    process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === 'true' &&
    process.env.NODE_ENV === 'development'
  ) {
    return {
      plan: 'pro',
      status: 'active',
      source: 'dev-bypass',
      limits: PLAN_LIMITS.pro,
    };
  }

  try {
    // Check user_subscription_status table for Stripe subscription
    const { data: subscription, error } = await supabase
      .from('user_subscription_status')
      .select('has_active_subscription, current_plan, subscription_status')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      // No subscription found - return starter (free) tier
      return {
        plan: 'starter',
        status: 'inactive',
        source: 'default',
        limits: PLAN_LIMITS.starter,
      };
    }

    if (subscription.has_active_subscription) {
      // Map Stripe plan to our plan types
      const planMap: Record<string, PlanType> = {
        'community': 'community',
        'self_defender': 'self_defender',
        'self-defender': 'self_defender',
        'emergency_pack': 'emergency_pack',
        'emergency-pack': 'emergency_pack',
        'mission_partner': 'mission_partner',
        'mission-partner': 'mission_partner',
      };

      const plan = planMap[subscription.current_plan || ''] || 'community';

      return {
        plan,
        status: 'active',
        source: 'stripe',
        limits: PLAN_LIMITS[plan],
      };
    }

    // Subscription exists but not active
    return {
      plan: 'starter',
      status: (subscription.subscription_status as UserPlan['status']) || 'inactive',
      source: 'stripe',
      limits: PLAN_LIMITS.starter,
    };
  } catch (err) {
    console.error('Error fetching user plan:', err);
    // Fail open to starter tier
    return {
      plan: 'starter',
      status: 'inactive',
      source: 'default',
      limits: PLAN_LIMITS.starter,
    };
  }
}

// Client-side hook-friendly version (sync check for dev bypass only)
export function isDevBypassEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_DEV_BYPASS === 'true' &&
    process.env.NODE_ENV === 'development'
  );
}

// Quick check without async - useful for UI gates
export function getDevBypassPlan(): UserPlan | null {
  if (isDevBypassEnabled()) {
    return {
      plan: 'pro',
      status: 'active',
      source: 'dev-bypass',
      limits: PLAN_LIMITS.pro,
    };
  }
  return null;
}
