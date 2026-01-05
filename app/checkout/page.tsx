'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: '🕊️ Starter',
    price: '$0',
    period: '/mo',
    description: 'Perfect for getting started',
    features: [
      '3 recordings per month',
      '7-day evidence storage',
      'Basic PDF reports',
      'ProofAI watermark',
    ],
  },
  {
    id: 'community',
    name: '🤝 Community',
    price: '$4.99',
    period: '/mo',
    description: 'For regular documentation needs',
    features: [
      '15 recordings per month',
      '30-day evidence storage',
      'AI summarization',
      'Custom folders',
      'No watermark',
    ],
  },
  {
    id: 'self_defender',
    name: '🛡️ Self-Defender',
    price: '$9.99',
    period: '/mo',
    description: 'Unlimited protection',
    features: [
      'Unlimited recordings',
      '100GB storage',
      'Advanced AI analysis',
      'Custom PDF branding',
      '24/7 priority support',
    ],
    highlight: true,
  },
  {
    id: 'emergency_pack',
    name: '🚨 Emergency Pack',
    price: '$14.99',
    period: ' one-time',
    description: 'For urgent situations',
    features: [
      '10 recordings (never expire)',
      'Lifetime evidence storage',
      'Priority processing',
      'Court-ready documentation',
    ],
  },
  {
    id: 'mission_partner',
    name: '🌍 Mission Partner',
    price: '$19.99',
    period: '/mo',
    description: 'Support the mission',
    features: [
      'All Self-Defender features',
      'Supporter badge',
      'Fund free accounts for others',
      'Early access to features',
    ],
  },
];

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  
  const preselectedPlan = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState<string>(preselectedPlan || 'self_defender');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push(`/login?redirect=/checkout${preselectedPlan ? `?plan=${preselectedPlan}` : ''}`);
    }
  }, [session, authLoading, router, preselectedPlan]);

  const handleCheckout = async () => {
    if (!session?.user) {
      toast.error('Please sign in to continue');
      router.push('/login');
      return;
    }

    if (selectedPlan === 'starter') {
      toast.success('You\'re on the free plan!');
      router.push('/dashboard');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          userId: session.user.id,
          userEmail: session.user.email,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  const currentPlan = PLANS.find(p => p.id === selectedPlan);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Your Plan</h2>
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${plan.highlight ? 'ring-2 ring-blue-200' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{plan.name}</span>
                      {plan.highlight && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">{plan.period}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {currentPlan && (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{currentPlan.name}</h3>
                      <p className="text-sm text-gray-500">{currentPlan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">{currentPlan.price}</span>
                      <span className="text-gray-500">{currentPlan.period}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">What's included:</h4>
                    <ul className="space-y-2">
                      {currentPlan.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{currentPlan.price}{currentPlan.period}</span>
                    </div>
                    {currentPlan.id !== 'emergency_pack' && currentPlan.id !== 'starter' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Billed monthly. Cancel anytime.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : selectedPlan === 'starter' ? (
                      'Continue with Free Plan'
                    ) : (
                      `Pay ${currentPlan.price}${currentPlan.period}`
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure checkout
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                      Powered by Stripe
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
