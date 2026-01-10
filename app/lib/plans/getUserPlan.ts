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
  | 'mission_partner'   // $19.99/mo
  | 'business'          // Business tier
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
  // One-time packs (stackable with any plan)
  emergencyCredits: number;
  hasEmergencyPack: boolean;
  hasCourtCertification: boolean;
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
  business: {
    recordingsPerMonth: Infinity,
    storageDays: Infinity,
    maxFileSizeMB: 1000,
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
      emergencyCredits: 0,
      hasEmergencyPack: false,
      hasCourtCertification: false,
    };
  }

  try {
    // Check user_subscription_status table for Stripe subscription
    const { data: subscription, error } = await supabase
      .from('user_subscription_status')
      .select('has_active_subscription, current_plan, subscription_status')
      .eq('user_id', userId)
      .single();

    // Also fetch pack status from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('emergency_credits, has_emergency_pack, has_court_certification')
      .eq('id', userId)
      .single();

    const emergencyCredits = profile?.emergency_credits || 0;
    const hasEmergencyPack = profile?.has_emergency_pack || false;
    const hasCourtCertification = profile?.has_court_certification || false;

    if (error || !subscription) {
      // No subscription found - return starter (free) tier
      return {
        plan: 'starter',
        status: 'inactive',
        source: 'default',
        limits: PLAN_LIMITS.starter,
        emergencyCredits,
        hasEmergencyPack,
        hasCourtCertification,
      };
    }

    if (subscription.has_active_subscription) {
      // Map Stripe plan to our plan types
      const planMap: Record<string, PlanType> = {
        'community': 'community',
        'self_defender': 'self_defender',
        'self-defender': 'self_defender',
        'mission_partner': 'mission_partner',
        'mission-partner': 'mission_partner',
        'business': 'business',
      };

      const plan = planMap[subscription.current_plan || ''] || 'community';

      return {
        plan,
        status: 'active',
        source: 'stripe',
        limits: PLAN_LIMITS[plan],
        emergencyCredits,
        hasEmergencyPack,
        hasCourtCertification,
      };
    }

    // Subscription exists but not active
    return {
      plan: 'starter',
      status: (subscription.subscription_status as UserPlan['status']) || 'inactive',
      source: 'stripe',
      limits: PLAN_LIMITS.starter,
      emergencyCredits,
      hasEmergencyPack,
      hasCourtCertification,
    };
  } catch (err) {
    console.error('Error fetching user plan:', err);
    // Fail open to starter tier
    return {
      plan: 'starter',
      status: 'inactive',
      source: 'default',
      limits: PLAN_LIMITS.starter,
      emergencyCredits: 0,
      hasEmergencyPack: false,
      hasCourtCertification: false,
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
      emergencyCredits: 0,
      hasEmergencyPack: false,
      hasCourtCertification: false,
    };
  }
  return null;
}
