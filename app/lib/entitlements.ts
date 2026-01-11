import { createClient } from '@supabase/supabase-js';

export interface UserEntitlements {
  isAdmin: boolean;
  isSupport: boolean;
  hasUnlimitedAccess: boolean;
  plan: string;
  hasCourtCertification: boolean;
  humanitarianCredits: number;
  canRecord: boolean;
  canGenerateReports: boolean;
  canAccessCourtFeatures: boolean;
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, plan_override, has_court_certification')
    .eq('id', userId)
    .single();

  const role = profile?.role || 'user';
  const plan = profile?.plan || 'starter';
  const planOverride = profile?.plan_override || false;
  const hasCourtCert = profile?.has_court_certification || false;

  // Check for manual court certification grant
  const { data: manualCert } = await supabase
    .from('court_certifications')
    .select('id')
    .eq('user_id', userId)
    .eq('valid', true)
    .limit(1);

  const hasManualCertification = (manualCert?.length || 0) > 0;

  // Check humanitarian credits
  const { data: credits } = await supabase
    .from('humanitarian_credits')
    .select('credits_remaining, expires_at')
    .eq('user_id', userId)
    .gt('credits_remaining', 0);

  // Sum non-expired credits
  const now = new Date();
  const totalCredits = (credits || []).reduce((sum, c) => {
    if (!c.expires_at || new Date(c.expires_at) > now) {
      return sum + (c.credits_remaining || 0);
    }
    return sum;
  }, 0);

  // Determine access levels
  const isAdmin = role === 'admin';
  const isSupport = role === 'support';
  const hasUnlimitedAccess = isAdmin || planOverride || plan === 'lifetime';

  // Court certification: from Stripe purchase, manual grant, or admin
  const hasCourtCertification = hasUnlimitedAccess || hasCourtCert || hasManualCertification;

  // Recording/report access: unlimited, paid plan, or has credits
  const hasPaidPlan = ['community', 'self-defender', 'mission-partner', 'business', 'lifetime'].includes(plan);
  const canRecord = hasUnlimitedAccess || hasPaidPlan || totalCredits > 0;
  const canGenerateReports = hasUnlimitedAccess || hasPaidPlan || totalCredits > 0;
  const canAccessCourtFeatures = hasCourtCertification;

  return {
    isAdmin,
    isSupport,
    hasUnlimitedAccess,
    plan,
    hasCourtCertification,
    humanitarianCredits: totalCredits,
    canRecord,
    canGenerateReports,
    canAccessCourtFeatures,
  };
}

// Client-side version using browser supabase
export async function getClientEntitlements(supabase: any, userId: string): Promise<Partial<UserEntitlements>> {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, plan, plan_override, has_court_certification')
    .eq('id', userId)
    .single();

  const role = profile?.role || 'user';
  const plan = profile?.plan || 'starter';
  const planOverride = profile?.plan_override || false;

  const isAdmin = role === 'admin';
  const isSupport = role === 'support';
  const hasUnlimitedAccess = isAdmin || planOverride || plan === 'lifetime';

  return {
    isAdmin,
    isSupport,
    hasUnlimitedAccess,
    plan,
    hasCourtCertification: profile?.has_court_certification || false,
  };
}
