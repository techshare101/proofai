'use client';

import Link from 'next/link';

export default function Pricing() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Basic protection for individuals',
      features: [
        '5 video recordings per month',
        'Basic AI summary',
        'PDF report generation',
        'Video evidence storage (7 days)',
        'Email support'
      ],
      buttonText: 'Start for Free',
      highlight: false
    },
    {
      name: 'Pro',
      price: '$9.99',
      description: 'Complete protection for professionals',
      features: [
        'Unlimited video recordings',
        'Advanced AI analysis',
        'Priority processing',
        'Permanent evidence storage',
        'Custom branding on reports',
        '24/7 priority support',
        'Legal template library'
      ],
      buttonText: 'Go Pro',
      highlight: true
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
                  <Link
                    href={tier.name === 'Free' ? '/signup' : '/login'}
                    className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                      tier.highlight
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-800 hover:bg-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {tier.buttonText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
