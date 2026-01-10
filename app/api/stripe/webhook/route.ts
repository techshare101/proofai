import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map Stripe price IDs to SUBSCRIPTION plans (identity)
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY!]: 'community',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_SELF_DEFENDER!]: 'self_defender',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_MISSION_PARTNER!]: 'mission_partner',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS!]: 'business',
};

// One-time pack price IDs (stackable, don't replace plan)
const ONE_TIME_PACKS = {
  EMERGENCY_PACK: process.env.NEXT_PUBLIC_STRIPE_PRICE_EMERGENCY_PACK,
  COURT_CERTIFICATION: process.env.NEXT_PUBLIC_STRIPE_PRICE_COURT_CERTIFICATION,
};

async function updateSubscriptionStatus(
  userId: string,
  data: {
    has_active_subscription: boolean;
    subscription_status?: string;
    current_plan?: string;
    stripe_customer_id?: string;
    stripe_price_id?: string;
    stripe_current_period_end?: string;
    cancel_at_period_end?: boolean;
  }
) {
  const { error } = await supabase
    .from('user_subscription_status')
    .upsert({
      user_id: userId,
      ...data,
      subscription_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`📥 Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;

        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        // For one-time payments (Emergency Pack / Court Certification)
        if (session.mode === 'payment') {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;

          // Emergency Pack - adds credits, doesn't change plan
          if (priceId === ONE_TIME_PACKS.EMERGENCY_PACK) {
            console.log(`🎁 Granting Emergency Pack to user ${userId}`);
            const { error } = await supabase.rpc('grant_emergency_pack', {
              user_id_input: userId,
            });
            if (error) {
              console.error('Error granting emergency pack:', error);
              // Fallback: direct update
              await supabase
                .from('profiles')
                .update({
                  emergency_credits: supabase.rpc('increment_emergency_credits', { user_id_input: userId }),
                  has_emergency_pack: true,
                })
                .eq('id', userId);
            }
          }

          // Court Certification - grants legal features
          if (priceId === ONE_TIME_PACKS.COURT_CERTIFICATION) {
            console.log(`⚖️ Granting Court Certification to user ${userId}`);
            await supabase
              .from('profiles')
              .update({
                has_court_certification: true,
                court_certified_at: new Date().toISOString(),
              })
              .eq('id', userId);
          }

          // Also update subscription status for tracking
          await updateSubscriptionStatus(userId, {
            has_active_subscription: true,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
          });
        }
        // Subscription will be handled by customer.subscription.created
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          // Try to get userId from customer metadata
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if (customer.deleted) break;
          
          const customerUserId = (customer as Stripe.Customer).metadata?.userId;
          if (!customerUserId) {
            console.error('No userId found for subscription');
            break;
          }
        }

        const priceId = subscription.items.data[0]?.price.id;
        const planType = PRICE_TO_PLAN[priceId] || 'community';

        await updateSubscriptionStatus(userId || subscription.metadata?.userId!, {
          has_active_subscription: subscription.status === 'active' || subscription.status === 'trialing',
          subscription_status: subscription.status,
          current_plan: planType,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: priceId,
          stripe_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: (subscription as any).cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await updateSubscriptionStatus(userId, {
            has_active_subscription: false,
            subscription_status: 'canceled',
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = (subscription as any).metadata?.userId;

          if (userId) {
            await updateSubscriptionStatus(userId, {
              has_active_subscription: true,
              subscription_status: 'active',
              stripe_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = (subscription as any).metadata?.userId;

          if (userId) {
            await updateSubscriptionStatus(userId, {
              has_active_subscription: false,
              subscription_status: 'past_due',
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
