// Recording time limits based on subscription tier
export const planLimits: Record<string, number> = {
  free: 60,         // 1 minute
  starter: 120,     // 2 minutes
  pro: 300,         // 5 minutes
  enterprise: 600,  // 10 minutes
  legal: 1800       // 30 minutes
};

// Default to 'free' if user has no plan or plan is unknown
export function getUserPlan(user: any): string {
  if (!user) return 'free';
  
  // Extract plan from user object (adjust based on your actual data structure)
  const plan = user.plan || user.subscription_tier || user.subscription?.tier || 'free';
  
  // Validate the plan exists in our limits, otherwise default to free
  return planLimits[plan] ? plan : 'free';
}

// Get the maximum recording duration in seconds for a user
export function getMaxRecordingDuration(user: any): number {
  const plan = getUserPlan(user);
  return planLimits[plan];
}

// Format seconds to MM:SS for display
export function formatRecordingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
