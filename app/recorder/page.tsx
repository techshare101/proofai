'use client'

import Recorder from '@/components/Recorder'
import Link from 'next/link'

export default function RecorderPage() {
  return (
    <main className="min-h-screen p-6 bg-white flex flex-col items-center">
      {/* Back to Dashboard button */}
      <div className="w-full max-w-2xl mb-4">
        <Link 
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">ProofAI</h1>
      <p className="text-gray-600 mb-6">Record and document your truth</p>
      <Recorder />
    </main>
  )
}
