'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function Pricing() {
  const { session } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planType: string) => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (planType === 'starter') {
      router.push('/dashboard');
      return;
    }

    setLoadingPlan(planType);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          userId: session.user.id,
          userEmail: session.user.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const tiers = [
    {
      name: '🕊️ Starter',
      planType: 'starter',
      price: '$0',
      period: 'mo',
      description: '3 recordings/month, 7-day storage, watermark included',
      features: [
        '3 recordings per month',
        '7-day evidence storage',
        'Basic PDF reports',
        'ProofAI watermark',
        'Email support'
      ],
      buttonText: 'Start for Free',
      highlight: false
    },
    {
      name: '🤝 Community',
      planType: 'community',
      price: '$4.99',
      period: 'mo',
      description: '15 recordings/month, 30-day storage, AI summary, folders',
      features: [
        '15 recordings per month',
        '30-day evidence storage',
        'AI summarization',
        'Custom folders',
        'Priority email support'
      ],
      buttonText: 'Choose Community',
      highlight: false
    },
    {
      name: '🛡️ Self-Defender',
      planType: 'self_defender',
      price: '$9.99',
      period: 'mo',
      description: 'Unlimited proofs, 100GB storage, custom PDF branding',
      features: [
        'Unlimited recordings',
        '100GB storage',
        'Advanced AI analysis',
        'Custom PDF branding',
        '24/7 priority support'
      ],
      buttonText: 'Go Pro',
      highlight: true
    },
    {
      name: '🚨 Emergency Pack',
      planType: 'emergency_pack',
      price: '$14.99',
      period: 'one-time',
      description: '10 recordings, no subscription, court/emergency use',
      features: [
        '10 recordings (no expiration)',
        'Lifetime evidence storage',
        'Priority processing',
        'Premium support',
        'Court-ready documentation'
      ],
      buttonText: 'Get Emergency Pack',
      highlight: false
    },
    {
      name: '🌍 Mission Partner',
      planType: 'mission_partner',
      price: '$19.99',
      period: 'mo',
      description: 'Helps fund free accounts for others + supporter badge',
      features: [
        'All Self-Defender features',
        'Supporter badge',
        'Fund free accounts for others',
        'Early access to new features',
        'Community recognition'
      ],
      buttonText: 'Become a Partner',
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`flex flex-col rounded-lg shadow-lg overflow-hidden ${
                tier.highlight ? 'border-2 border-indigo-500 transform scale-105' : 'border border-gray-200'
              }`}
            >
              <div className="px-6 py-8 bg-white sm:p-10">
                <h3 className="text-2xl font-medium text-gray-900">
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold">
                  {tier.price}
                  <span className="ml-1 text-2xl font-medium text-gray-500">
                    /mo
                  </span>
                </div>
                <p className="mt-5 text-lg text-gray-500">
                  {tier.description}
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-700">
                        {feature}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="rounded-md shadow">
                  <button
                    onClick={() => handleSubscribe(tier.planType)}
                    disabled={loadingPlan === tier.planType}
                    className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                      tier.highlight
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-800 hover:bg-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loadingPlan === tier.planType ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : tier.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
