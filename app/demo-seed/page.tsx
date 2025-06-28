'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { insertSampleReports } from '../utils/insertSampleReports'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DemoSeedPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null)
  const router = useRouter()

  const handleSeedReports = async () => {
    if (!session?.user?.id) {
      setResult({
        success: false,
        message: 'You must be logged in to seed sample reports.'
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)
      
      const reportIds = await insertSampleReports(session.user.id)
      
      setResult({
        success: true,
        message: `Successfully created ${reportIds.length} sample reports across different folders.`
      })
    } catch (error) {
      console.error('Error seeding reports:', error)
      setResult({
        success: false,
        message: 'Failed to seed sample reports. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ProofAI Demo Data</h2>
            <p className="text-gray-600 mb-6">
              Seed your account with sample reports across different folders
            </p>
          </div>
          
          {!session ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You must be logged in to seed sample data.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          
          {result && (
            <div className={`mb-6 p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.message}
            </div>
          )}
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleSeedReports}
              disabled={loading || !session}
              className={`py-3 px-4 bg-blue-600 text-white font-medium rounded-md flex justify-center items-center transition-colors ${loading || !session ? 'bg-blue-400 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Sample Reports...
                </>
              ) : (
                'Create Sample Reports'
              )}
            </button>
            
            <Link 
              href="/dashboard" 
              className="py-3 px-4 bg-gray-100 text-gray-800 font-medium rounded-md text-center hover:bg-gray-200 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
