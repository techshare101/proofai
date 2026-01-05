'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // Give webhook time to process, then show success
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };
    
    checkAuth();
  }, []);

  // Auto-redirect countdown after loading completes
  useEffect(() => {
    if (isLoading) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to dashboard if authenticated, otherwise to login
          router.push(isAuthenticated ? '/dashboard' : '/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900">Processing your payment...</h1>
            <p className="text-gray-600 mt-2">Please wait while we activate your account.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for subscribing to ProofAI. Your account has been upgraded and you now have access to all premium features.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to {isAuthenticated ? 'dashboard' : 'login'} in {countdown} seconds...
            </p>
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Sign In to Continue'}
            </Link>
            <Link
              href="/recorder"
              className="inline-block w-full px-6 py-3 mt-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Start Recording
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
