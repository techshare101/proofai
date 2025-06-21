'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabaseClient'
import Link from 'next/link'
import ReportCard, { Report } from '../components/dashboard/ReportCard'
import EmptyState from '../components/dashboard/EmptyState'
import { createPortal } from 'react-dom'
import PDFViewerModal from '../components/dashboard/PDFViewerModal'

export default function DashboardPage() {
  const { session } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [isBrowser, setIsBrowser] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isFolderCreating, setIsFolderCreating] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)

  // Fetch reports when session or activeFolder changes
  useEffect(() => {
    if (session?.user) {
      fetchReports()
    }
  }, [session, activeFolder])
  
  // Listen for folder changes from sidebar
  useEffect(() => {
    const handleFolderChange = (e: CustomEvent) => {
      setActiveFolder(e.detail.folderId)
    }
    
    window.addEventListener('folderChange', handleFolderChange as EventListener)
    return () => window.removeEventListener('folderChange', handleFolderChange as EventListener)
  }, [])
  
  // Set isBrowser to true after component mount for portal support
  useEffect(() => {
    setIsBrowser(true)
  }, [])
  
  const fetchReports = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('reports')
        .select(`
          id, title, summary, pdf_url, folder_id, created_at,
          folders(name)
        `)
        .eq('user_id', session.user.id)
      
      // Filter by folder if selected
      if (activeFolder) {
        query = query.eq('folder_id', activeFolder)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) {
        // Format the data to include folder name and map folder to folder_id
        const formattedReports: Report[] = data.map(item => {
          // With the folders(name) syntax, folders could be an array with objects or a single object
          const folderName = Array.isArray(item.folders) && item.folders.length > 0
            ? item.folders[0]?.name
            : (item.folders as any)?.name || 'Uncategorized'
          
          return {
            id: item.id,
            title: item.title || 'Untitled Report',
            summary: item.summary || 'No summary available',
            pdf_url: item.pdf_url,
            folder_id: item.folder_id, // Use folder_id directly from DB
            folder_name: folderName,
            created_at: item.created_at
          }
        })
        
        setReports(formattedReports)
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err)
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter(report => report.id !== reportId))
  }
  
  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setShowPdfModal(true)
  }
  
  // Handle new folder creation
  const createNewFolder = async () => {
    if (!session?.user?.id) return
    if (!newFolderName.trim()) {
      setFolderError('Please enter a folder name')
      return
    }
    
    try {
      setIsFolderCreating(true)
      setFolderError(null)
      
      // Get the current authenticated user to ensure we have the latest session
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User is not authenticated')
      }
      
      // Create folder with explicit user_id from current auth session
      // This ensures compliance with the RLS policy: auth.uid() = user_id
      const { data, error } = await supabase
        .from('folders')
        .insert([
          {
            name: newFolderName.trim(),
            user_id: user.id // Make sure this matches auth.uid() for RLS
          }
        ])
        .select()
      
      if (error) throw error
      
      // Close modal and reset state
      setShowNewFolderModal(false)
      setNewFolderName('')
      
      // Optionally switch to the new folder
      if (data && data[0]) {
        setActiveFolder(data[0].id)
      }
      
      // Here you would typically refresh the folder list in the sidebar
      // This could be done via a custom event or context state
      const folderChangeEvent = new CustomEvent('folderListChange')
      window.dispatchEvent(folderChangeEvent)
      
    } catch (err: any) {
      console.error('Error creating folder:', err)
      setFolderError('Failed to create folder')
    } finally {
      setIsFolderCreating(false)
    }
  }
  
  // Filter reports based on search
  const filteredReports = reports.filter(report => {
    return report.title.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  return (
    <div className="h-full">
      {/* Header section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Your Reports</h1>
        <p className="text-gray-600">Manage and view your PDF reports</p>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 md:ml-4">
          <div className="relative">
            <select
              value={activeFolder || ''}
              onChange={(e) => setActiveFolder(e.target.value !== 'all' ? e.target.value : null)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Folders</option>
              {/* This would normally be populated from a folders state */}
              <option value="default">My Reports</option>
              <option value="shared">Shared</option>
              <option value="archived">Archived</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          
          <button 
            onClick={() => setShowNewFolderModal(true)}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Folder
          </button>
          
          <Link href="/recorder" className="inline-block">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              New Recording
            </button>
          </Link>
        </div>
      </div>
      
      {/* Content area */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <EmptyState 
          title="No reports found" 
          message={searchQuery ? "No reports match your search" : "You don't have any reports yet"}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onView={handleViewReport}
              onDelete={handleDeleteReport}
            />
          ))}
        </div>
      )}
      
      {/* PDF Viewer Modal */}
      {isBrowser && showPdfModal && selectedReport && createPortal(
        <PDFViewerModal 
          report={selectedReport} 
          onClose={() => setShowPdfModal(false)} 
        />,
        document.body
      )}
      
      {/* New Folder Modal */}
      {isBrowser && showNewFolderModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Create New Folder</h3>
              <button 
                onClick={() => {
                  setShowNewFolderModal(false)
                  setNewFolderName('')
                  setFolderError(null)
                }}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
                  Folder Name
                </label>
                <input
                  id="folderName"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isFolderCreating}
                />
                {folderError && <p className="mt-1 text-sm text-red-600">{folderError}</p>}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewFolderModal(false)
                    setNewFolderName('')
                    setFolderError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isFolderCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={createNewFolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isFolderCreating}
                >
                  {isFolderCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Folder'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
