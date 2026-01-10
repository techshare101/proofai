/**
 * 🔒 STRIPE SUCCESS PAGE - TOP LEVEL ROUTE
 * Build ID: RADICAL-SWEEP-v4
 * 
 * This page is at /success (NOT /checkout/success) to avoid
 * route tree resolution issues that cause Vercel 404s.
 * 
 * RULES:
 * - Never redirect to /
 * - Never use plan-based routing
 * - Show thank you message
 * - Let user click to go to dashboard
 */
'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center mx-4">
        {/* Confetti Animation */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <span className="text-5xl animate-bounce">🎉</span>
        </div>

        {/* Success Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Welcome Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to ProofAI Pro!</h1>
        <p className="text-xl text-green-600 font-semibold mb-4">
          ✨ Your upgrade is complete!
        </p>
        
        {/* Benefits List */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 text-left">
          <p className="text-gray-700 font-medium mb-3">You now have access to:</p>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Unlimited recordings
            </li>
            <li className="flex items-center text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Extended recording time
            </li>
            <li className="flex items-center text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Priority AI processing
            </li>
            <li className="flex items-center text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Advanced report features
            </li>
          </ul>
        </div>

        {/* Primary CTA - Go to Dashboard */}
        <Link
          href="/dashboard"
          className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Go to Dashboard →
        </Link>

        {/* Secondary CTA - Start Recording */}
        <Link
          href="/recorder"
          className="inline-flex items-center justify-center w-full px-6 py-4 mt-4 bg-green-50 text-green-700 font-semibold rounded-xl hover:bg-green-100 transition border-2 border-green-200"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6" className="text-red-500" />
          </svg>
          Start Recording Now
        </Link>

        {/* Support Note */}
        <p className="text-sm text-gray-400 mt-8">
          Questions? We're here to help at{' '}
          <a href="mailto:support@proofai.app" className="text-blue-500 hover:underline">
            support@proofai.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h1>
          <p className="text-gray-600">Activating your premium account...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
