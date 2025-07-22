import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe
let stripe: Stripe;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }
  
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10' as any,
  });
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  throw new Error('Failed to initialize payment processor');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { stripe, supabase };

// Helper function to get or create a Stripe customer
export async function getOrCreateCustomer(userId: string, email: string) {
  try {
    // Check if we already have a customer ID in the database
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Save the customer ID in the database
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    return customer.id;
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw new Error('Failed to get or create customer');
  }
}

// Helper function to create a checkout session
export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  userId: string
) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: {
        userId,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Helper function to get the user's subscription status
export async function getUserSubscriptionStatus(userId: string) {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created', { ascending: false })
      .limit(1)
      .single();

    return subscription || null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}
