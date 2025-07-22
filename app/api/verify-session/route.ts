import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // Verify the session with Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!stripeSession || stripeSession.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update user's subscription status in your database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        stripe_customer_id: stripeSession.customer as string,
        plan_id: stripeSession.subscription as string,
        updated_at: new Date().toISOString()
      })
      .eq('id', authSession.user.id);

    if (updateError) {
      console.error('Error updating user subscription:', updateError);
      throw new Error('Failed to update subscription status');
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
