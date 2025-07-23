import { planLimits, getPlanDisplayName } from './stripe/plansConfig';

// Default to 'free' if user has no plan or plan is unknown
export function getUserPlan(user: any): string {
  if (!user) return 'free';
  
  // Check for development bypass
  const devEmail = user.email || user.user_metadata?.email || '';
  if (process.env.NODE_ENV !== 'production' && devEmail === 'caresim360@gmail.com') {
    console.log('[DEV] Bypassing plan checks for dev account:', devEmail);
    return 'unlimited';
  }
  
  // Extract plan from user object (adjust based on your actual data structure)
  const plan = user.plan || user.subscription_tier || user.subscription?.tier || 'free';
  
  // Validate the plan exists in our limits, otherwise default to free
  return plan in planLimits ? plan : 'free';
}

// Get the maximum recording duration in seconds for a user
export function getMaxRecordingDuration(user: any): number {
  if (!user) return planLimits.free;
  
  // Check for development bypass
  const devEmail = user.email || user.user_metadata?.email || '';
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEV] In development mode - bypassing plan limits');
    return planLimits.unlimited;
  }
  
  const plan = getUserPlan(user);
  return getMaxDurationForPlan(plan);
}

// Format seconds to MM:SS for display
export function formatRecordingTime(seconds: number): string {
  if (seconds >= planLimits.unlimited) return 'No Limit';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to get maximum duration for a specific plan
export function getMaxDurationForPlan(plan: string): number {
  // Return the plan limit if it exists, otherwise default to free tier
  return planLimits[plan] || planLimits.free;
}
