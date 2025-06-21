'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  message?: string
  showActionButton?: boolean
}

export default function EmptyState({
  title = 'No reports yet',
  message = 'Start recording to create your first report',
  showActionButton = true
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-block p-6 bg-blue-50 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      <h3 className="mt-5 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
      
      {showActionButton && (
        <div className="mt-6">
          <Link href="/recorder">
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start Recording
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
