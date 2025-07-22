'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function WebhookTestPage() {
  const { user, hasActiveSubscription, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerWebhook = async (eventType: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          eventType,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger webhook');
      }
      
      setResult(data);
      
      // Refresh the subscription status
      await refreshSubscription();
    } catch (err: any) {
      console.error('Error triggering webhook:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Webhook Test</h1>
          <p className="text-gray-600 mb-6">Please sign in to test webhook events.</p>
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
            Webhook Test
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Test Stripe webhook events and subscription updates
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Current User Status
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              View and test subscription status
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono truncate">
                  {user.id}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.email}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Subscription Status</dt>
                <dd className="mt-1 text-sm">
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
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Test Webhook Events
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Trigger test webhook events to simulate Stripe webhooks
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Checkout Completed</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Simulate a successful subscription checkout
                </p>
                <button
                  onClick={() => triggerWebhook('checkout.session.completed')}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Trigger Checkout'}
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Subscription Updated</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Simulate a subscription update (e.g., plan change)
                </p>
                <button
                  onClick={() => triggerWebhook('customer.subscription.updated')}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Update Subscription'}
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Subscription Deleted</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Simulate a subscription cancellation
                </p>
                <button
                  onClick={() => triggerWebhook('customer.subscription.deleted')}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {(result || error) && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {error ? 'Error Details' : 'Webhook Result'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {error ? 'An error occurred while processing the webhook' : 'Details of the last webhook event'}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(error || result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Testing Instructions
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              How to test the subscription flow
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-700">
              <li>Click "Trigger Checkout" to simulate a successful subscription purchase</li>
              <li>Verify that your subscription status updates to "Active"</li>
              <li>Click "Update Subscription" to test subscription updates</li>
              <li>Click "Cancel Subscription" to test cancellation flow</li>
              <li>Check the database to verify all data was updated correctly</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-800">Note:</h4>
              <p className="mt-1 text-sm text-blue-700">
                This is a test environment. No real payments will be processed, and all data can be reset.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
