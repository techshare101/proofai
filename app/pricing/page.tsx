"use client";

import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const features = [
  {
    title: "Military-Grade Security",
    description: "Securely record and store evidence with robust encryption and private access controls."
  },
  {
    title: "Instant PDF Reports",
    description: "Automatic summaries, timestamps, and court-ready formats."
  },
  {
    title: "Global Verification",
    description: "Worldwide metadata and timestamps for highest authenticity."
  },
  {
    title: "Cloud Backup",
    description: "Automatic backups ensure your evidence is always safe."
  },
  {
    title: "Team Collaboration",
    description: "Work together on evidence with secure team access and permissions."
  },
  {
    title: "24/7 Support",
    description: "Reach us anytime for assistance and guidance on your reports."
  }
];

export default function OnboardingPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    setSelectedPlan(planName);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Checkout failed: ${error}`);
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error starting checkout. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white">
      <header className="text-center py-16">
        <h1 className="text-4xl font-bold">Choose the perfect plan for you</h1>
        <p className="text-gray-300 mt-4">No hidden fees, no contracts. Cancel anytime.</p>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 grid md:grid-cols-5 gap-6">
        {/* Community Plan */}
        <div className="p-6 bg-slate-800 rounded-xl flex flex-col justify-between shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Community</h2>
          <p className="text-4xl font-bold mb-2">$4.99<span className="text-lg font-normal">/month</span></p>
          <ul className="text-sm mb-6 space-y-1">
            <li>✅ 5 recordings per month</li>
            <li>✅ Basic PDF reports</li>
          </ul>
          <button 
            onClick={() => handleCheckout('price_1RmlotGfFlbiKHjXP7lEltCR', 'Community')} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading && selectedPlan === 'Community' ? 'Processing...' : 'Get Started'}
          </button>
        </div>
        
        {/* Self Defender */}
        <div className="p-6 bg-purple-700 rounded-xl flex flex-col justify-between shadow-lg scale-105">
          <h2 className="text-2xl font-semibold mb-4">Self-Defender</h2>
          <p className="text-4xl font-bold mb-2">$9.99<span className="text-lg font-normal">/month</span></p>
          <ul className="text-sm mb-6 space-y-1">
            <li>✅ Unlimited recordings</li>
            <li>✅ Advanced PDF reports</li>
            <li>✅ Priority support</li>
          </ul>
          <button 
            onClick={() => handleCheckout('price_1Rmlq8GfFlbiKHjXx8PGJ7w7', 'Self-Defender')}
            disabled={loading}
            className="bg-white text-purple-700 font-semibold py-2 rounded-md disabled:opacity-50"
          >
            {loading && selectedPlan === 'Self-Defender' ? 'Processing...' : 'Get Started'}
          </button>
        </div>
        
        {/* Mission Partner */}
        <div className="p-6 bg-slate-800 rounded-xl flex flex-col justify-between shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Mission Partner</h2>
          <p className="text-4xl font-bold mb-2">$19.99<span className="text-lg font-normal">/month</span></p>
          <ul className="text-sm mb-6 space-y-1">
            <li>✅ Unlimited recordings</li>
            <li>✅ Branded reports</li>
            <li>✅ Team sharing</li>
          </ul>
          <button 
            onClick={() => handleCheckout('price_1RmlqcGfFlbiKHjXz88vHlP7', 'Mission Partner')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading && selectedPlan === 'Mission Partner' ? 'Processing...' : 'Get Started'}
          </button>
        </div>
        
        {/* Business Plan */}
        <div className="p-6 bg-slate-800 rounded-xl flex flex-col justify-between shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Business</h2>
          <p className="text-4xl font-bold mb-2">$49<span className="text-lg font-normal">/month</span></p>
          <ul className="text-sm mb-6 space-y-1">
            <li>✅ Unlimited everything</li>
            <li>✅ Priority support</li>
            <li>✅ AI summaries</li>
          </ul>
          <button 
            onClick={() => handleCheckout('price_1RmlrGGfFlbiKHjXUQ1MDzS3', 'Business')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading && selectedPlan === 'Business' ? 'Processing...' : 'Get Started'}
          </button>
        </div>
        
        {/* Court Certification */}
        <div className="p-6 bg-slate-800 rounded-xl flex flex-col justify-between shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Court Certification</h2>
          <p className="text-4xl font-bold mb-2">$150<span className="text-lg font-normal"> one-time</span></p>
          <ul className="text-sm mb-6 space-y-1">
            <li>✅ Court-ready certificate</li>
            <li>✅ Verified signature</li>
            <li>✅ Priority legal support</li>
          </ul>
          <button 
            onClick={() => handleCheckout('price_1RmlrtGfFlbiKHjXbWp9dJYY', 'Court Certification')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading && selectedPlan === 'Court Certification' ? 'Processing...' : 'Get Certified'}
          </button>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="mt-16 bg-gradient-to-r from-purple-700 to-blue-600 text-center py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Ready to protect your truth?</h2>
          <p className="text-gray-200 mb-6">Join thousands of users who trust ProofAI to document and protect their rights.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => router.push('/recorder')} 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Start Recording Now
            </button>
            <button 
              onClick={() => router.push('/signup')} 
              className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-gray-400 text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p> 2025 ProofAI. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
