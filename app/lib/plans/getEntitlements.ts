/**
 * 🔒 ENTITLEMENTS HELPER
 * 
 * Clean helper to check what a user can do based on:
 * - Their subscription plan
 * - Emergency Pack credits
 * - Court Certification status
 * 
 * Use this instead of checking `plan === 'community'` directly.
 */

import { UserPlan } from './getUserPlan';

export interface Entitlements {
  // Recording access
  canRecord: boolean;
  recordingsRemaining: number; // Infinity for unlimited
  isUnlimited: boolean;
  
  // Features
  canExportPDF: boolean;
  canUseFolders: boolean;
  canUseAISummary: boolean;
  canRemoveWatermark: boolean;
  canUseCustomBranding: boolean;
  
  // Court features
  canGenerateCourtPDF: boolean;
  hasCourtCertification: boolean;
  
  // Pack status
  hasEmergencyPack: boolean;
  emergencyCredits: number;
  
  // Plan info
  planName: string;
  isPaid: boolean;
  isActive: boolean;
}

/**
 * Calculate user entitlements from their plan + packs
 * 
 * Usage:
 * ```ts
 * const { canRecord, recordingsRemaining, canGenerateCourtPDF } = getEntitlements(userPlan);
 * ```
 */
export function getEntitlements(userPlan: UserPlan, usedRecordings: number = 0): Entitlements {
  const { plan, status, limits, emergencyCredits, hasEmergencyPack, hasCourtCertification } = userPlan;
  
  const isActive = status === 'active' || status === 'trialing';
  const isPaid = plan !== 'starter' && isActive;
  
  // Calculate recordings remaining
  // Base from plan + emergency credits
  const baseRecordings = limits.recordingsPerMonth;
  const totalAvailable = baseRecordings === Infinity 
    ? Infinity 
    : baseRecordings + emergencyCredits;
  
  const recordingsRemaining = totalAvailable === Infinity 
    ? Infinity 
    : Math.max(0, totalAvailable - usedRecordings);
  
  const isUnlimited = baseRecordings === Infinity;
  
  // Can record if:
  // - Has unlimited recordings, OR
  // - Has recordings remaining (from plan or emergency credits)
  const canRecord = isUnlimited || recordingsRemaining > 0;
  
  // Court PDF access:
  // - Has court certification pack, OR
  // - Is on Business plan (includes court features)
  const canGenerateCourtPDF = hasCourtCertification || plan === 'business';
  
  // Plan display name
  const planNames: Record<string, string> = {
    'starter': 'Starter (Free)',
    'community': 'Community',
    'self_defender': 'Self-Defender',
    'mission_partner': 'Mission Partner',
    'business': 'Business',
    'pro': 'Pro',
  };
  
  return {
    // Recording access
    canRecord,
    recordingsRemaining,
    isUnlimited,
    
    // Features from plan limits
    canExportPDF: limits.pdfExport,
    canUseFolders: limits.folders,
    canUseAISummary: limits.aiSummary,
    canRemoveWatermark: !limits.watermark,
    canUseCustomBranding: limits.customBranding,
    
    // Court features
    canGenerateCourtPDF,
    hasCourtCertification,
    
    // Pack status
    hasEmergencyPack,
    emergencyCredits,
    
    // Plan info
    planName: planNames[plan] || plan,
    isPaid,
    isActive,
  };
}

/**
 * Quick check if user should see upgrade prompts
 * Returns false if user has ANY paid access (plan OR packs)
 */
export function shouldShowUpgradePrompt(userPlan: UserPlan, usedRecordings: number = 0): boolean {
  const entitlements = getEntitlements(userPlan, usedRecordings);
  
  // Don't show upgrade if:
  // - User is on a paid plan
  // - User has emergency credits remaining
  // - User has court certification
  if (entitlements.isPaid) return false;
  if (entitlements.emergencyCredits > 0) return false;
  if (entitlements.hasCourtCertification) return false;
  
  // Show upgrade if they can't record
  return !entitlements.canRecord;
}
