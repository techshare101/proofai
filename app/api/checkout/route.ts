import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe, getOrCreateCustomer, createCheckoutSession } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user?.email) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { error: 'Not authenticated', details: sessionError?.message },
        { status: 401 }
      );
    }

    const { priceId } = await req.json();
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId in request' },
        { status: 400 }
      );
    }

    // Get or create a Stripe customer
    const customerId = await getOrCreateCustomer(session.user.id, session.user.email);
    
    // Create a checkout session
    const checkoutSession = await createCheckoutSession(
      priceId,
      customerId,
      session.user.id
    );

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session');
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      }, 
      { status: 500 }
    );
  }
}
