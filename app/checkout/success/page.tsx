/**
 * 🔒 STRIPE SUCCESS PAGE
 * This page MUST:
 * - Never redirect to /
 * - Never use plan-based routing
 * - Show thank you message
 * - Let user click to go to dashboard
 */
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center mx-4">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Thank You Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You! 🎉</h1>
        <p className="text-lg text-gray-600 mb-2">
          Your payment was successful.
        </p>
        <p className="text-gray-500 mb-8">
          Your account has been upgraded and you now have access to all your premium features. Start documenting your truth today!
        </p>

        {/* Go to Dashboard Button */}
        <Link
          href="/dashboard"
          className="block w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
        >
          Go to Dashboard →
        </Link>

        {/* Secondary Action */}
        <Link
          href="/recorder"
          className="inline-block w-full px-6 py-3 mt-4 text-blue-600 font-medium hover:text-blue-700 transition"
        >
          Or start recording now
        </Link>

        {/* Support Note */}
        <p className="text-xs text-gray-400 mt-8">
          Questions? Contact us at support@proofai.app
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900">Processing your payment...</h1>
          <p className="text-gray-600 mt-2">Please wait while we activate your account.</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
