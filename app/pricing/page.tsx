'use client'

import Pricing from '../components/Pricing'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Choose Your Plan</h1>
          <div className="w-32"></div>
        </div>
      </header>
      
      {/* Pricing Component */}
      <Pricing />
    </main>
  )
}
