'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
      <p className="text-gray-600 mb-6">Start recording or view your past reports.</p>

      <Link href="/recorder">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Start Recording
        </button>
      </Link>
    </main>
  )
}
