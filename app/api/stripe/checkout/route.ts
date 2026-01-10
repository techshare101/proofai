import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get APP_URL from environment or use production URL
const getAppUrl = (request: NextRequest) => {
  // First try environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fall back to request origin
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  if (host) {
    return `${protocol}://${host}`;
  }
  // Last resort fallback
  return 'https://proofai-prod.vercel.app';
};

// Map plan types to Stripe price IDs
const PLAN_TO_PRICE: Record<string, string | undefined> = {
  // Subscriptions (identity - one at a time)
  community: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY,
  self_defender: process.env.NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER,
  mission_partner: process.env.NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER,
  business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
  // One-time packs (stackable)
  emergency_pack: process.env.NEXT_PUBLIC_STRIPE_PRICE_EMERGENCY_PACK,
  court_certification: process.env.NEXT_PUBLIC_STRIPE_PRICE_COURT_CERTIFICATION,
};

// One-time payment types (not subscriptions)
const ONE_TIME_PLANS = ['emergency_pack', 'court_certification'];

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json(
        { error: 'Database configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { planType, userId, userEmail } = await request.json();

    if (!planType || !userId) {
      return NextResponse.json(
        { error: 'Missing planType or userId' },
        { status: 400 }
      );
    }

    const priceId = PLAN_TO_PRICE[planType];
    if (!priceId) {
      console.error(`Price ID not configured for plan: ${planType}`);
      return NextResponse.json(
        { error: `Plan "${planType}" is not yet available. Please contact support.` },
        { status: 400 }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Determine if this is a one-time payment or subscription
    const isOneTime = ONE_TIME_PLANS.includes(planType);
    
    // Get the app URL dynamically
    const appUrl = getAppUrl(request);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isOneTime ? 'payment' : 'subscription',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId,
        planType,
      },
      subscription_data: isOneTime ? undefined : {
        metadata: {
          userId,
          planType,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
