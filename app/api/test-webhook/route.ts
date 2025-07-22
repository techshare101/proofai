import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    const { userId, eventType } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Simulate different webhook events based on the eventType
    let subscriptionData;
    switch (eventType) {
      case 'checkout.session.completed':
        subscriptionData = {
          id: `sub_test_${Date.now()}`,
          status: 'active',
          customer: `cus_test_${Date.now()}`,
          items: {
            data: [{
              price: {
                id: 'price_test_123',
              },
            }],
          },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          cancel_at_period_end: false,
        };
        break;
        
      case 'customer.subscription.updated':
        subscriptionData = {
          id: `sub_test_${Date.now()}`,
          status: 'active',
          customer: `cus_test_${Date.now()}`,
          items: {
            data: [{
              price: {
                id: 'price_test_123',
              },
            }],
          },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          cancel_at_period_end: false,
        };
        break;
        
      case 'customer.subscription.deleted':
        // Update the user's subscription status to inactive
        await supabase
          .from('profiles')
          .update({ 
            has_active_subscription: false,
            subscription_status: 'canceled',
            subscription_id: null,
            current_plan: null,
          })
          .eq('id', userId);
          
        return NextResponse.json({
          success: true,
          message: 'Subscription canceled successfully',
          userId,
          eventType,
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    // Update the user's subscription status in the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Update the subscription in the database
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: subscriptionData.id,
        stripe_customer_id: subscriptionData.customer,
        stripe_price_id: subscriptionData.items.data[0].price.id,
        status: subscriptionData.status,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        stripe_current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
      }, {
        onConflict: 'stripe_subscription_id',
      });

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }

    // Update the user's profile with subscription status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        has_active_subscription: subscriptionData.status === 'active',
        subscription_status: subscriptionData.status,
        subscription_id: subscriptionData.id,
        stripe_customer_id: subscriptionData.customer,
        current_plan: 'premium', // or get this from the price ID
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: `Webhook ${eventType} processed successfully`,
      userId,
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        customer: subscriptionData.customer,
        current_period_end: subscriptionData.current_period_end,
      },
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
