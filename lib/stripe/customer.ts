import { stripe } from './config';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getOrCreateCustomer(userId: string) {
  try {
    // Check if we already have a customer ID in the database
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    // If customer already exists, return it
    if (user?.stripe_customer_id) {
      return {
        stripe_customer_id: user.stripe_customer_id,
        email: user.email || '',
      };
    }

    // Get user email from auth provider if not in profiles
    let email = user?.email;
    if (!email) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      email = authUser.user?.email || '';
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Save the customer ID in our database
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user with Stripe customer ID:', updateError);
      // Continue anyway, we have the customer ID from Stripe
    }

    return {
      stripe_customer_id: customer.id,
      email: customer.email || '',
    };
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    return null;
  }
}

export async function getCustomerSubscription(userId: string) {
  try {
    // Get the customer ID from our database
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return { subscription: null, error: 'No customer found' };
    }

    // Get the customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 1,
    });

    return {
      subscription: subscriptions.data[0] || null,
    };
  } catch (error) {
    console.error('Error getting customer subscription:', error);
    return { subscription: null, error: 'Error fetching subscription' };
  }
}
