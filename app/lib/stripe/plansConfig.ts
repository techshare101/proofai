// app/lib/stripe/plansConfig.ts

/**
 * Plan limits in seconds
 * These values are used for both UI display and server-side validation
 */
export const planLimits: { [key: string]: number } = {
  free: 60,            // 1 minute
  community: 120,      // 2 minutes
  selfdefender: 180,   // 3 minutes
  missionpartner: 300, // 5 minutes
  business: 600,       // 10 minutes
  unlimited: 36000,    // 10 hours for testing
};

/**
 * Get display name for a plan
 */
export function getPlanDisplayName(planKey: string): string {
  const names: { [key: string]: string } = {
    free: 'Free',
    community: 'Community',
    selfdefender: 'Self-Defender',
    missionpartner: 'Mission Partner',
    business: 'Business',
    unlimited: 'Unlimited 🚀',
  };
  
  return names[planKey] || planKey;
}

/**
 * Format seconds into MM:SS format
 */
export function formatDuration(seconds: number): string {
  if (seconds >= 36000) return 'No Limit';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get all available plans for the debug panel
 */
export function getAvailablePlans() {
  return Object.entries(planLimits).map(([key, seconds]) => ({
    key,
    name: getPlanDisplayName(key),
    duration: formatDuration(seconds),
    isUnlimited: key === 'unlimited',
  }));
}
