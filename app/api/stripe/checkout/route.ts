import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://proofai.vercel.app';

// Map plan types to Stripe price IDs
const PLAN_TO_PRICE: Record<string, string | undefined> = {
  community: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY,
  self_defender: process.env.NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER,
  mission_partner: process.env.NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER,
  emergency_pack: process.env.NEXT_PUBLIC_STRIPE_PRICE_EMERGENCY_PACK,
};

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

    // Determine if this is a one-time payment (emergency pack) or subscription
    const isOneTime = planType === 'emergency_pack';

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
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/checkout/cancel`,
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
