'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Recorder from '@/components/Recorder';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">ProofAI</h1>
        <p className="text-lg text-gray-600 mb-8">Record and document your truth</p>
        <Recorder />
      </div>
    </main>
  );
}
