'use client'

import { useState } from 'react'
import supabase from '../../lib/supabaseClient'

export interface Report {
  id: string
  title: string
  summary?: string | null
  pdf_url: string
  folder_id: string | null
  created_at: string
  folder_name?: string
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

interface ReportCardProps {
  report: Report
  onView: (report: Report) => void
  onDelete: (reportId: string) => void
}

export default function ReportCard({ report, onView, onDelete }: ReportCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this report?')) {
      setIsDeleting(true)
      try {
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', report.id)
        
        if (error) throw error
        
        onDelete(report.id)
      } catch (error) {
        console.error('Error deleting report:', error)
        alert('Failed to delete report')
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  // Format the created_at date
  const formattedDate = report.created_at
    ? getTimeAgo(new Date(report.created_at))
    : 'Unknown date'

  return (
    <div 
      onClick={() => onView(report)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 transform hover:scale-[1.03] cursor-pointer overflow-hidden"
    >
      <div className="p-6">
        {/* PDF Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-md mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 truncate max-w-[180px]">{report.title}</h3>
              {report.created_at && (
                <div className="text-gray-500 text-sm">
                  {getTimeAgo(new Date(report.created_at))}
                </div>
              )}
            </div>
          </div>
          
          {/* Folder tag */}
          {report.folder_name && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {report.folder_name}
            </span>
          )}
        </div>
        
        {/* Summary */}
        {report.summary && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 line-clamp-2">{report.summary}</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-4 flex justify-end space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              window.open(report.pdf_url, '_blank')
            }}
            className="text-blue-600 hover:text-blue-800"
            title="Download"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className={`${isDeleting ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
