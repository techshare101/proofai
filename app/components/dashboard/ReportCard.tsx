'use client'

import { useState, useRef, useEffect } from 'react'
import { deleteReportWithFiles } from './ReportDeleteHandler'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export interface Report {
  id: string
  title: string
  summary?: string | null
  pdf_url: string
  file_url?: string | null
  video_url?: string | null
  folder_id: string | null
  created_at: string
  folder_name?: string
}

export interface Folder {
  id: string
  name: string
}

// Format date as "M/D/YYYY, h:mm:ss AM/PM"
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

interface ReportCardProps {
  report: Report
  onView: (report: Report) => void
  onDelete: (reportId: string) => void
  onMove?: (reportId: string, folderId: string | null) => void
  folders?: Folder[]
  isDraggable?: boolean
}

export default function ReportCard({ report, onView, onDelete, onMove, folders = [], isDraggable = true }: ReportCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMoveDropdown, setShowMoveDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Debug: log folders when dropdown opens
  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('📁 Move button clicked, folders:', folders)
    setShowMoveDropdown(!showMoveDropdown)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoveDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
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
        const success = await deleteReportWithFiles(report.id)
        if (success) {
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
        zIndex: isDragging ? 10 : 0
      }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all ${isDeleting ? 'opacity-50' : ''} ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate" title={report.title}>
        {report.title}
      </h3>
      
      {/* Folder Badge */}
      {report.folder_name && (
        <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded mb-2">
          {report.folder_name}
        </span>
      )}
      
      {/* Date */}
      <p className="text-sm text-gray-500 mb-3">
        {report.created_at ? formatDate(report.created_at) : 'Unknown date'}
      </p>
      
      {/* Action Buttons - matching screenshot layout */}
      <div className="flex flex-wrap gap-2">
        {/* View PDF Button - Uses API route for fresh signed URLs */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            if (report.pdf_url) {
              // Use API route for secure, fresh signed URL access
              window.open(`/api/reports/${report.id}`, '_blank', 'noopener')
            }
          }}
          disabled={!report.pdf_url}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border ${
            report.pdf_url 
              ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View PDF
        </button>
        
        {/* Watch Video Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            if (report.video_url) {
              window.open(report.video_url, '_blank')
            }
          }}
          disabled={!report.video_url}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border ${
            report.video_url 
              ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Watch Video
        </button>
        
        {/* Delete Button */}
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border ${
            isDeleting 
              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-wait' 
              : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
          }`}
        >
          {isDeleting ? (
            <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          Delete
        </button>
        
        {/* Move Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleMoveClick}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg border text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Move
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Folder Dropdown */}
          {showMoveDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                {/* Uncategorized option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onMove) {
                      onMove(report.id, null)
                    }
                    setShowMoveDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    report.folder_id === null ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  📁 Uncategorized
                </button>
                
                {folders.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-gray-500 italic">No folders yet</p>
                ) : (
                  folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onMove) {
                          onMove(report.id, folder.id)
                        }
                        setShowMoveDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        report.folder_id === folder.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      📁 {folder.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
