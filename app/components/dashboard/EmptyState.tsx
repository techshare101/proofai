'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  message?: string
  showActionButton?: boolean
  folderName?: string | null
  showUploadOption?: boolean
}

export default function EmptyState({
  title = 'No reports found',
  message = 'You haven\'t added any reports yet. Ready to create your first proof?',
  showActionButton = true,
  folderName = null,
  showUploadOption = true
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
      {/* Custom icon: document with magnifying glass */}
      <div className="inline-block p-6 bg-blue-50 rounded-full relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="absolute -bottom-2 -right-2 bg-blue-100 rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <h3 className="mt-6 text-xl font-medium text-gray-900">{title}</h3>
      
      {folderName ? (
        <p className="mt-3 text-md text-gray-600 max-w-md mx-auto">
          Looks like the folder <span className="font-semibold">{folderName}</span> is empty. Add a report to get started.
        </p>
      ) : (
        <p className="mt-3 text-md text-gray-600 max-w-md mx-auto">{message}</p>
      )}
      
      {showActionButton && (
        <div className="mt-8 flex flex-col sm:flex-row w-full max-w-md mx-auto items-center gap-4">
          <Link href="/recorder" className="w-full">
            <button className="w-full inline-flex items-center justify-center px-6 py-4 sm:py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-h-[44px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start Recording
            </button>
          </Link>
          
          {showUploadOption && (
            <button 
              onClick={() => alert('Upload functionality would be implemented here')}
              className="w-full inline-flex items-center justify-center px-6 py-4 sm:py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-h-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Report
            </button>
          )}
        </div>
      )}
    </div>
  )
}
