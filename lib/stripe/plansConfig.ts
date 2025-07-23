// lib/stripe/plansConfig.ts
export const planLimits: Record<string, { maxMinutes: number }> = {
  free: { maxMinutes: 60 },
  pro: { maxMinutes: 300 },
  premium: { maxMinutes: 600 },
};

export function getPlanDisplayName(plan: string): string {
  switch (plan) {
    case 'pro': return 'Pro Plan';
    case 'premium': return 'Premium Plan';
    default: return 'Free Plan';
  }
}
