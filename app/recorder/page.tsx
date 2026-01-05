/**
 * 🔒 SINGLE RECORDER PAGE - v2.0
 * This is the ONLY recorder page. No plan-based forks.
 * Build: 2026-01-05-v2
 */
'use client'

import Recorder from '@/components/Recorder'

export default function RecorderPage() {
  return (
    <main className="min-h-screen p-6 bg-white flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">ProofAI</h1>
      <p className="text-gray-600 mb-6">Record and document your truth</p>
      <Recorder />
    </main>
  )
}
