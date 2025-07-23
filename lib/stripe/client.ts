import { stripe } from './config';
import { getOrCreateCustomer as getOrCreateCustomerUtil } from './customer';

export { stripe };

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  return getOrCreateCustomerUtil(userId, email);
}

export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  userId: string
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    customer: customerId,
    client_reference_id: userId,
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return session;
}
