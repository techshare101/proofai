// Feature flags and debug settings
export const config = {
  // Set to false to use real Stripe data
  useDebugPlans: process.env.NEXT_PUBLIC_USE_DEBUG_PLANS === 'true',
  
  // Debug plan data (used when useDebugPlans is true)
  debugPlan: {
    plan: 'self_defender', // Default debug plan
    whisper_minutes_limit: 120,
    whisper_minutes_used: 0,
    status: 'active',
    billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  
  // Stripe configuration
  stripe: {
    // Public key for client-side usage
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    
    // Webhook secret for verifying webhook signatures
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    
    // Price IDs for different plans (replace with your actual price IDs)
    priceIds: {
      community: process.env.STRIPE_COMMUNITY_PRICE_ID || 'price_community',
      selfDefender: process.env.STRIPE_SELF_DEFENDER_PRICE_ID || 'price_self_defender',
      missionPartner: process.env.STRIPE_MISSION_PARTNER_PRICE_ID || 'price_mission_partner',
      emergencyPack: process.env.STRIPE_EMERGENCY_PACK_PRICE_ID || 'price_emergency_pack',
      business: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business',
    },
  },
};

// Type exports
export type PlanName = keyof typeof config.stripe.priceIds;

export default config;
