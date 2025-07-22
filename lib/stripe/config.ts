import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Map Stripe price IDs to plan names and their respective minute limits
export const PRICE_ID_TO_PLAN = {
  // Replace these with your actual Stripe price IDs
  'price_community': {
    name: 'community',
    whisperMinutesLimit: 30,
    priceInCents: 499, // $4.99
    features: ['30 min/month', '15 recordings', '30-day storage', 'AI summaries']
  },
  'price_self_defender': {
    name: 'self_defender',
    whisperMinutesLimit: 120,
    priceInCents: 999, // $9.99
    features: ['120 min/month', 'Unlimited proofs', '100GB storage', 'Advanced AI']
  },
  'price_mission_partner': {
    name: 'mission_partner',
    whisperMinutesLimit: 120,
    priceInCents: 1999, // $19.99
    features: ['120 min/month', 'Team management', 'Priority support', 'Advanced features']
  },
  'price_emergency_pack': {
    name: 'emergency_pack',
    whisperMinutesLimit: 0, // Not time-based, uses recording count
    recordingsLimit: 10,
    priceInCents: 1499, // $14.99
    isOneTime: true,
    features: ['10 recordings', 'One-time purchase', 'No subscription']
  },
  'price_business': {
    name: 'business',
    whisperMinutesLimit: 300, // 5 hours default, can be increased
    priceInCents: 4999, // $49.99
    isPerSeat: true,
    features: ['300 min/month', 'Team management', 'Priority support', 'Custom limits']
  }
} as const;

export type PlanName = typeof PRICE_ID_TO_PLAN[keyof typeof PRICE_ID_TO_PLAN]['name'];

export const PLANS = {
  STARTER: {
    name: 'starter',
    whisperMinutesLimit: 0,
    recordingsLimit: 3,
    features: ['3 recordings', '7-day storage', 'Basic features'],
    priceInCents: 0
  },
  ...Object.values(PRICE_ID_TO_PLAN).reduce((acc, plan) => ({
    ...acc,
    [plan.name.toUpperCase()]: plan
  }), {})
} as const;

// Helper to get plan details by price ID
export function getPlanByPriceId(priceId: string) {
  return PRICE_ID_TO_PLAN[priceId as keyof typeof PRICE_ID_TO_PLAN];
}

// Helper to get plan details by name
export function getPlanByName(planName: string) {
  return Object.values(PLANS).find(plan => plan.name === planName) || PLANS.STARTER;
}
