'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login'); // redirect if not logged in
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="h-12 w-12 border-2 border-indigo-500 rounded-full animate-spin inline-block"></div>
          </div>
          <p className="text-gray-600">Checking auth...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard</h1>
            <p className="mt-4 text-gray-600">
              You&apos;re logged in as {session.user?.email}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
