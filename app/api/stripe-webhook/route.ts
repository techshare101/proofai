import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { PRICE_ID_TO_PLAN } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get raw body as string
async function getRawBody(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  try {
    const body = await getRawBody(req.body);
    const sig = headers().get('stripe-signature') as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.customer) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  
  await handleSubscriptionUpdated(subscription);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;
  
  if (!customerId) return;

  // Get the user from our database using the customer ID
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Get the plan details from the subscription
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return;

  const plan = PRICE_ID_TO_PLAN[priceId as keyof typeof PRICE_ID_TO_PLAN];
  if (!plan) return;

  // Calculate billing period
  const now = new Date();
  const billingPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  // Update or create the user's plan in Supabase
  await supabaseAdmin.from('user_plans').upsert({
    user_id: user.id,
    plan: plan.name,
    whisper_minutes_limit: plan.whisperMinutesLimit,
    whisper_minutes_used: 0, // Reset used minutes on new subscription
    billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    billing_period_end: billingPeriodEnd.toISOString(),
    status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    updated_at: now.toISOString(),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;
  
  if (!customerId) return;

  // Get the user from our database
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) return;

  // Downgrade the user to the free plan
  await supabaseAdmin.from('user_plans').upsert({
    user_id: user.id,
    plan: 'starter',
    whisper_minutes_limit: 0,
    whisper_minutes_used: 0,
    status: 'canceled',
    updated_at: new Date().toISOString(),
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;
  
  if (!customerId) return;

  // Update the user's subscription status in your database
  await supabaseAdmin
    .from('user_plans')
    .update({ status: 'active' })
    .eq('stripe_customer_id', customerId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;
  
  if (!customerId) return;

  // Update the user's subscription status in your database
  await supabaseAdmin
    .from('user_plans')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', customerId);
}
