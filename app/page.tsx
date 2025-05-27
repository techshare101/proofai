'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Recorder from '@/components/Recorder';
import SignIn from '@/components/SignIn';
import AuthError from '@/components/AuthError';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (loading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    if (error) {
      return <AuthError message={error} />;
    }

    return (
      <main className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Welcome to ProofAI</h1>
          <p className="text-gray-600 mb-8">Sign in to start recording and documenting your truth.</p>
          <SignIn />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">ProofAI Recorder</h1>
      <Recorder />
    </main>
  );
}
