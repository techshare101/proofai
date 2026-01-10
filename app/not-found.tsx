'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  
  // Auto-redirect to dashboard after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to dashboard in 3 seconds...
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
