'use client'

import { useState, useRef } from 'react'
import { Card } from '../ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FaEye, FaTrash, FaEdit, FaEllipsisV } from 'react-icons/fa'
import { deleteReportWithFiles } from './ReportDeleteHandler'
import supabase from '../../lib/supabase'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import ReportContextMenu from './ReportContextMenu'

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
  isDraggable?: boolean
}

export default function ReportCard({ report, onView, onDelete, isDraggable = true }: ReportCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Set up draggable functionality
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `report-${report.id}`,
    data: {
      type: 'report',
      report
    },
    disabled: !isDraggable
  })
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this report?')) {
      setIsDeleting(true)
      try {
        // Use the enhanced delete handler that also removes files from storage
        const success = await deleteReportWithFiles(report.id);
        
        if (success) {
          // Notify parent component to update UI
          onDelete(report.id)
        }
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

  // Apply drag transform styles
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <ReportContextMenu
      report={report}
      onView={onView}
      onDelete={onDelete}
      onRename={async (id, newTitle) => {
        try {
          const { error } = await supabase
            .from('reports')
            .update({ title: newTitle })
            .eq('id', id)
          
          if (error) throw error
          
          // Update happens via client-side refresh/optimistic UI
          window.location.reload()
        } catch (error) {
          console.error('Error renaming report:', error)
          alert('Failed to rename report')
        }
      }}
    >
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
          opacity: isDragging ? 0.5 : undefined,
          zIndex: isDragging ? 10 : 0
        }}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all relative cursor-pointer ${isDeleting ? 'opacity-50' : ''} ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => onView(report)}
        {...attributes}
        {...listeners}
      >
        <div className="flex">
          {/* Left: PDF Icon/Thumbnail */}
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg shadow-sm border border-red-200 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                <span className="flex h-4 w-4 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 truncate max-w-[220px]">{report.title}</h3>
              </div>
              
              {/* Folder tag */}
              {report.folder_name && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full truncate max-w-[100px] flex-shrink-0">
                  {report.folder_name}
                </span>
              )}
            </div>

            {/* Summary - limited to 2 lines */}
            <div className="mt-1">
              <p className="text-sm text-gray-600 line-clamp-2 h-10 overflow-hidden">
                {report.summary || "No summary available."}
              </p>
            </div>
            
            {/* Footer with timestamp and actions */}
            <div className="mt-3 flex items-center justify-between">
              {/* Timestamp with icon */}
              <div className="flex items-center text-gray-500 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {report.created_at && getTimeAgo(new Date(report.created_at))}
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(report.pdf_url, '_blank')
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                  title="Open PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className={`p-1 rounded-full hover:bg-red-50 ${isDeleting ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReportContextMenu>
  )
}
