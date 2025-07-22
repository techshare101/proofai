import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Using raw-body with proper types
declare function getRawBody(
  req: import('http').IncomingMessage,
  options?: { limit?: string | number; length?: number; encoding?: string }
): Promise<Buffer>;

// Initialize Stripe with error handling
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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const rawBody = await getRawBody(req as any);
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody.toString(),
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Log the webhook event
    await supabase.from('webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event.data.object,
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = createRouteHandlerClient({ cookies });
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  
  await updateSubscriptionInDatabase(subscription);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  await updateSubscriptionInDatabase(subscription);
}

async function updateSubscriptionInDatabase(subscription: Stripe.Subscription) {
  const supabase = createRouteHandlerClient({ cookies });
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  // Get the user ID from the subscription metadata or lookup by customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile || profileError) {
    console.error('No profile found for customer:', customerId, profileError);
    return;
  }

  const currentPeriodEnd = new Date(
    (subscription as any).current_period_end ? (subscription as any).current_period_end * 1000 : Date.now()
  ).toISOString();

  // Update the subscriptions table
  const subscriptionData = {
    user_id: profile.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    stripe_price_id: subscription.items.data[0].price.id,
    stripe_current_period_end: currentPeriodEnd,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  // Update the user_subscription_status table
  const statusData = {
    user_id: profile.id,
    stripe_customer_id: customerId,
    stripe_price_id: subscription.items.data[0].price.id,
    subscription_status_detail: subscription.status,
    stripe_current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    subscription_updated_at: new Date().toISOString()
  };

  // Use a transaction to update both tables
  const { error } = await supabase.rpc('update_subscription_tables', {
    subscription_data: subscriptionData,
    status_data: statusData,
    user_id_param: profile.id
  });

  if (error) {
    console.error('Error updating subscription tables:', error);
    
    // Fallback to individual updates if the RPC function fails
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
      });

    if (subError) {
      console.error('Error updating subscriptions table:', subError);
    }

    const { error: statusError } = await supabase
      .from('user_subscription_status')
      .upsert(statusData, {
        onConflict: 'user_id',
      });

    if (statusError) {
      console.error('Error updating user_subscription_status table:', statusError);
    }
  }
}

// Extend the Stripe.Invoice type to include the subscription property
type ExtendedInvoice = Stripe.Invoice & {
  subscription?: string | { id: string };
};

async function handleInvoicePaid(invoice: ExtendedInvoice) {
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) {
    console.error('No customer ID found in invoice:', invoice.id);
    return;
  }

  // Handle different types of subscription IDs in the invoice
  let subscriptionId: string | undefined;
  
  if (invoice.subscription) {
    if (typeof invoice.subscription === 'string') {
      subscriptionId = invoice.subscription;
    } else if ('id' in invoice.subscription) {
      subscriptionId = invoice.subscription.id;
    }
  } else if (invoice.lines?.data?.[0]?.subscription) {
    // Fallback to getting subscription ID from invoice lines
    const lineSubscription = invoice.lines.data[0].subscription;
    subscriptionId = typeof lineSubscription === 'string' 
      ? lineSubscription 
      : lineSubscription?.id;
  }
  
  if (!subscriptionId) {
    console.error('No valid subscription ID found in invoice:', invoice.id);
    return;
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await updateSubscriptionInDatabase(subscription);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) return;

  const supabase = createRouteHandlerClient({ cookies });
  
  // Update the user's subscription status to past_due
  await supabase
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);
}
