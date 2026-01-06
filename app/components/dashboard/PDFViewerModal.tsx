'use client'

import { useState, useEffect } from 'react'
import { Report } from './ReportCard'

interface PDFViewerModalProps {
  report: Report
  onClose: () => void
}

export default function PDFViewerModal({ report, onClose }: PDFViewerModalProps) {
  const [fileSize, setFileSize] = useState<string>('Unknown')
  const [isLoading, setIsLoading] = useState(true)
  
  // Use API route for secure PDF access
  const pdfApiUrl = `/api/reports/${report.id}`
  
  useEffect(() => {
    // Skip file size fetch - API route handles this securely
    setIsLoading(false)
  }, [report.id])
  
  // Helper function to format file size in KB, MB, etc.
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // Helper function to format date in a readable format
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }
  
  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
    
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
  }
  
  // Format date strings - use created_at from Report type
  const formattedDate = report.created_at 
    ? formatDate(new Date(report.created_at))
    : 'Unknown date'
    
  const timeAgo = report.created_at 
    ? getTimeAgo(new Date(report.created_at))
    : ''

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
            <p className="text-sm text-gray-500">{formattedDate} ({timeAgo})</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Main PDF viewer - Uses API route for secure access */}
          <div className="flex-1 bg-gray-100 overflow-hidden">
            <iframe 
              src={`${pdfApiUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0" 
              title={report.title}
              onLoad={() => setIsLoading(false)}
            />
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {/* Sidebar with metadata */}
          <div className="w-64 border-l p-4 overflow-y-auto flex flex-col">
            <h4 className="font-medium text-gray-900 mb-4">Document Details</h4>
            
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd>{formattedDate}</dd>
              </div>
              
              <div>
                <dt className="text-gray-500">File Size</dt>
                <dd>{fileSize}</dd>
              </div>
              
              {report.folder_name && (
                <div>
                  <dt className="text-gray-500">Folder</dt>
                  <dd className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full inline-block mt-1">
                    {report.folder_name}
                  </dd>
                </div>
              )}
              
              {report.summary && (
                <div>
                  <dt className="text-gray-500 mb-1">Summary</dt>
                  <dd className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {report.summary}
                  </dd>
                </div>
              )}
            </dl>
            
            <div className="mt-auto pt-4 border-t">
              <a 
                href={pdfApiUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
