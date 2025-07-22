'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SubscriptionTestPage() {
  const { user, hasActiveSubscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const supabase = createClientComponentClient();

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch subscription status from our view
      const { data, error } = await supabase
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      setSubscriptionData(data);
    } catch (err: any) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user, hasActiveSubscription]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Subscription Test</h1>
          <p className="text-gray-600 mb-6">Please sign in to test the subscription flow.</p>
          <a 
            href="/login" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Subscription Test
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Test the subscription flow and view your current status
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Subscription Status
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your current subscription information
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {hasActiveSubscription ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Inactive
                    </span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {subscriptionData?.stripe_price_id || 'No active subscription'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Subscription ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {subscriptionData?.subscription_id || 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Renews On</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {subscriptionData?.stripe_current_period_end 
                    ? new Date(subscriptionData.stripe_current_period_end).toLocaleDateString()
                    : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Test Subscription Plans
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Select a plan to test the checkout flow
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Basic</h3>
                  <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                    $9.99
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                  <p className="mt-5 text-sm text-gray-500">
                    Perfect for individuals getting started with our service.
                  </p>
                </div>
                <div className="px-4 pb-5 sm:px-6">
                  <button
                    onClick={() => handleCheckout('price_1O0XvUGfFlbiKHjXyQbGvYp1')} // Replace with your actual price ID
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Subscribe Now'}
                  </button>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg border-2 border-blue-500 transform scale-105">
                <div className="px-4 py-5 sm:p-6">
                  <div className="absolute top-0 right-0 -mr-1 -mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Popular
                    </span>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Pro</h3>
                  <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                    $29.99
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                  <p className="mt-5 text-sm text-gray-500">
                    For professionals who need more power and features.
                  </p>
                </div>
                <div className="px-4 pb-5 sm:px-6">
                  <button
                    onClick={() => handleCheckout('price_1O0XvUGfFlbiKHjXyQbGvYp2')} // Replace with your actual price ID
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Get Started'}
                  </button>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Enterprise</h3>
                  <div className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                    $99.99
                    <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                  </div>
                  <p className="mt-5 text-sm text-gray-500">
                    For businesses that need the ultimate in features and support.
                  </p>
                </div>
                <div className="px-4 pb-5 sm:px-6">
                  <button
                    onClick={() => handleCheckout('price_1O0XvUGfFlbiKHjXyQbGvYp3')} // Replace with your actual price ID
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Contact Sales'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Debug Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Raw subscription data for debugging purposes
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify({
                user: {
                  id: user?.id,
                  email: user?.email,
                },
                hasActiveSubscription,
                subscriptionData,
                timestamp: new Date().toISOString(),
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
