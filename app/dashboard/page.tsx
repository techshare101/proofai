/**
 * 🔒 DASHBOARD v3.0 - 2026-01-10
 * Build ID: RADICAL-SWEEP-v3
 * 
 * This is the ONLY dashboard. If you see the old dashboard,
 * Vercel is serving a stale deployment.
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import Link from 'next/link'
import ReportCard, { Report, Folder } from '../components/dashboard/ReportCard'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import EmptyState from '../components/dashboard/EmptyState'
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton'
import PDFViewerModal from '../components/dashboard/PDFViewerModal'
import { insertDummyReport } from '../utils/insertDummyReport'
import ReportList from '../components/ReportList'
import { fetchReportsByFolder } from '../utils/fetchReportsByFolder'
import { Switch } from '@headlessui/react'
import { FaTable, FaThLarge } from 'react-icons/fa'
import { HiOutlineDocument } from 'react-icons/hi'
import FolderGroupedReports from '../components/dashboard/FolderGroupedReports'
import { useUserPlan } from '../hooks/useUserPlan'
import { useRecordingLimit } from '../hooks/useRecordingLimit'

export default function DashboardPage() {
  const { session } = useAuth()
  const { limits, isPro, isDevBypass, plan } = useUserPlan()
  const { used, limit, remaining, isUnlimited } = useRecordingLimit()
  const [reports, setReports] = useState<Report[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isBrowser, setIsBrowser] = useState(false)
  const [cardView, setCardView] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [dragFeedback, setDragFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to activate (prevents accidental drags)
      },
    })
  )

  // Fetch reports and folders when session changes
  useEffect(() => {
    if (session?.user) {
      fetchFolders() // Always fetch folders
      if (!activeFolder) {
        fetchReports()
      }
    }
  }, [session, activeFolder])
  
  // Fetch user's folders
  const fetchFolders = async () => {
    if (!session?.user?.id) {
      console.log('📁 fetchFolders: No user ID, skipping')
      return
    }
    
    try {
      console.log('📁 Fetching folders for user:', session.user.id)
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', session.user.id)
        .order('name')
      
      if (error) {
        console.error('❌ Error fetching folders:', error)
        throw error
      }
      console.log('📁 Folders fetched successfully:', data?.length, 'folders:', data)
      setFolders(data || [])
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }
  
  // Set isBrowser to true after component mount for portal support
  useEffect(() => {
    setIsBrowser(true)
  }, [])
  
  // Listen for folder changes from sidebar (create/delete)
  useEffect(() => {
    const handleFoldersChanged = async () => {
      console.log('📁 Folders changed event received, refetching...')
      if (!session?.user?.id) return
      
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', session.user.id)
        .order('name')
      
      if (!error && data) {
        console.log('📁 Folders refetched via event:', data)
        setFolders(data)
      }
    }
    
    window.addEventListener('foldersChanged', handleFoldersChanged)
    return () => window.removeEventListener('foldersChanged', handleFoldersChanged)
  }, [session?.user?.id])
  
  const fetchReports = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Use the existing query if we want to maintain backward compatibility
      // or switch to our new utility for folder-specific reports
      let data;
      
      if (activeFolder) {
        // Use our new utility function to fetch reports by folder
        data = await fetchReportsByFolder(activeFolder, session.user.id);
      } else {
        // Fetch all reports if no folder is selected
        const { data: allData, error } = await supabase
          .from('reports')
          .select(`
            id, title, summary, pdf_url, file_url, folder_id, created_at,
            folders(name)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        data = allData;
      }
      
      if (data) {
        // Format the data to include folder name and map folder to folder_id
        const formattedReports: Report[] = data.map(item => {
          // With the folders(name) syntax, folders could be an array with objects or a single object
          const folderName = Array.isArray(item.folders) && item.folders.length > 0
            ? item.folders[0]?.name
            : (item.folders as any)?.name || 'Uncategorized'
          
          // Extract video URL from summary JSONB or file_url
          let videoUrl: string | null = null
          let summaryText: string = 'No summary available'
          
          if (item.summary) {
            // Check if summary is a JSONB object
            if (typeof item.summary === 'object') {
              const summaryObj = item.summary as any
              videoUrl = summaryObj.videoUrl || summaryObj.video_url || null
              summaryText = summaryObj.summary || 'No summary available'
            } else if (typeof item.summary === 'string') {
              // Try to parse as JSON
              try {
                const parsed = JSON.parse(item.summary)
                videoUrl = parsed.videoUrl || parsed.video_url || null
                summaryText = parsed.summary || item.summary
              } catch {
                summaryText = item.summary
              }
            }
          }
          
          // Determine the actual video URL - prefer extracted videoUrl, then check file_url
          let finalVideoUrl = videoUrl
          if (!finalVideoUrl && item.file_url) {
            // Only use file_url as video if it's a video file (not a PDF)
            if (item.file_url.includes('.webm') || item.file_url.includes('.mp4') || item.file_url.includes('.mov')) {
              finalVideoUrl = item.file_url
            }
          }
          
          // Normalize signed URLs to public URLs for recordings bucket
          if (finalVideoUrl && finalVideoUrl.includes('/object/sign/recordings/')) {
            const match = finalVideoUrl.match(/\/recordings\/(.+?)(\?|$)/)
            if (match) {
              finalVideoUrl = `https://fiwtckfmtbcxryhhggsb.supabase.co/storage/v1/object/public/recordings/${match[1]}`
            }
          }
          
          // Normalize PDF URL - convert signed URLs to public URLs
          let finalPdfUrl = item.pdf_url
          if (finalPdfUrl) {
            // Handle signed URLs for proofai-pdfs bucket
            if (finalPdfUrl.includes('/object/sign/proofai-pdfs/')) {
              const match = finalPdfUrl.match(/\/proofai-pdfs\/(.+?)(\?|$)/)
              if (match) {
                finalPdfUrl = `https://fiwtckfmtbcxryhhggsb.supabase.co/storage/v1/object/public/proofai-pdfs/${match[1]}`
              }
            }
            // Handle other signed URL patterns
            else if (finalPdfUrl.includes('/object/sign/')) {
              // Try to extract bucket and path
              const match = finalPdfUrl.match(/\/object\/sign\/([^/]+)\/(.+?)(\?|$)/)
              if (match) {
                finalPdfUrl = `https://fiwtckfmtbcxryhhggsb.supabase.co/storage/v1/object/public/${match[1]}/${match[2]}`
              }
            }
          }
          
          return {
            id: item.id,
            title: item.title || 'Untitled Report',
            summary: summaryText,
            pdf_url: finalPdfUrl,
            file_url: item.file_url,
            video_url: finalVideoUrl,
            folder_id: item.folder_id,
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
  
  // Handle moving a report to a folder via dropdown
  const handleMoveReport = async (reportId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ folder_id: folderId })
        .eq('id', reportId)
      
      if (error) throw error
      
      // Find folder name for UI update
      const folderName = folderId 
        ? folders.find(f => f.id === folderId)?.name || 'Unknown'
        : 'Uncategorized'
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, folder_id: folderId, folder_name: folderName }
          : report
      ))
      
      setDragFeedback({ message: `Moved to ${folderName}`, type: 'success' })
      setTimeout(() => setDragFeedback(null), 2000)
    } catch (err) {
      console.error('Error moving report:', err)
      setDragFeedback({ message: 'Failed to move report', type: 'error' })
      setTimeout(() => setDragFeedback(null), 3000)
    }
  }
  
  // Handle report dropped in folder
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Safety checks
    if (!active || !over) return;
    
    // Extract IDs and types from the drag/drop event
    const isReportDrag = active.id.toString().startsWith('report-');
    const isFolderDrop = over.id.toString().startsWith('folder-');
    
    if (isReportDrag && isFolderDrop) {
      const reportId = active.id.toString().replace('report-', '');
      const folderId = over.id.toString().replace('folder-', '');
      
      // Get the report data
      const reportData = reports.find(r => r.id === reportId);
      if (!reportData) return;
      
      // Show feedback
      setDragFeedback({
        message: `Moving "${reportData.title}" to folder...`,
        type: 'success'
      });
      
      try {
        // Update the report in Supabase
        const { error } = await supabase
          .from('reports')
          .update({ folder_id: folderId })
          .eq('id', reportId);
          
        if (error) throw error;
        
        // Update local state
        setReports(reports.map(report => {
          if (report.id === reportId) {
            return { ...report, folder_id: folderId };
          }
          return report;
        }));
        
        setDragFeedback({
          message: 'Report moved successfully!',
          type: 'success'
        });
        
        // Clear feedback after 3 seconds
        setTimeout(() => setDragFeedback(null), 3000);
        
      } catch (err) {
        console.error('Error moving report:', err);
        setDragFeedback({
          message: 'Failed to move report',
          type: 'error'
        });
        setTimeout(() => setDragFeedback(null), 3000);
      }
    }
  };
  
  /**
   * Filters reports based on search query, folder, and date criteria
   * @param reportsToFilter - Array of reports to be filtered
   * @param filters - Object containing filter criteria
   * @returns Filtered array of reports
   */
  const filterReports = (reportsToFilter: Report[], filters: {
    query: string;
    dateRange: string;
  }) => {
    const { query, dateRange } = filters;
    
    return reportsToFilter.filter(report => {
      // Search filter - match title or summary
      const matchesSearch = !query || 
        report.title.toLowerCase().includes(query.toLowerCase()) || 
        (report.summary?.toLowerCase() || '').includes(query.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (dateRange === 'recent') {
        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        matchesDate = new Date(report.created_at) >= sevenDaysAgo;
      } else if (dateRange === 'month') {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesDate = new Date(report.created_at) >= thirtyDaysAgo;
      }
      
      return matchesSearch && matchesDate;
    });
  };
  
  // Apply filters to get filtered reports
  const filteredReports = filterReports(reports, {
    query: searchQuery,
    dateRange: dateFilter
  })
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full">
        {/* Main Content */}
        <div className="flex-1">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Reports</h1>
            <p className="text-gray-600">Manage and view your PDF reports</p>
            {/* Build verification - remove after confirming deployment works */}
            <p className="text-xs text-purple-500 font-mono">Build: RADICAL-SWEEP-v3 | {new Date().toISOString().split('T')[0]}</p>
          </div>
          
          {/* Plan Badge & Usage */}
          <div className="flex items-center gap-4">
            {/* Recording Usage */}
            {!isUnlimited && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{remaining}</span> of {limit} recordings left
              </div>
            )}
            
            {/* Plan Badge */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDevBypass 
                ? 'bg-purple-100 text-purple-700' 
                : isPro 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
            }`}>
              {isDevBypass ? '🔧 Dev Mode' : plan.plan === 'starter' ? '🕊️ Starter' : 
               plan.plan === 'community' ? '🤝 Community' :
               plan.plan === 'self_defender' ? '🛡️ Self-Defender' :
               plan.plan === 'emergency_pack' ? '🚨 Emergency' :
               plan.plan === 'mission_partner' ? '🌍 Partner' : plan.plan}
            </div>
            
            {/* Upgrade CTA for free users */}
            {!isPro && !isDevBypass && (
              <Link 
                href="/pricing"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            aria-label="Search reports by title or summary"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto">
          <Link href="/recorder" className="w-full sm:w-auto inline-block">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]">
              New Recording
            </button>
          </Link>
        </div>
      </div>
      
      {/* Filter Bar */}
      {!activeFolder && (
        <div className="mb-6 mt-4 flex flex-col sm:flex-row flex-wrap gap-3">
          {/* We're using the search input from the section above, no need to duplicate */}

          <select 
            className="px-4 py-3 border rounded-md text-sm bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date range"
          >
            <option value="recent">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      )}
      
      {/* Content area */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : !activeFolder ? (
        <>
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <Switch
                checked={cardView}
                onChange={setCardView}
                className={`${cardView ? "bg-blue-600" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
              >
                <span
                  className={`${
                    cardView ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                />
              </Switch>
              {cardView ? <FaThLarge className="text-blue-600" /> : <FaTable className="text-blue-600" />}
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <LoadingSkeleton count={3} />
            </div>
          ) : filteredReports.length === 0 ? (
            <EmptyState 
              title="No reports found" 
              message={searchQuery ? "No reports match your search" : "You haven't added any reports yet. Ready to create your first proof?"}
              showUploadOption={true}
              folderName={null}
            />
          ) : cardView ? (
            activeFolder ? (
              // Regular card grid for folder view
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onView={(report) => window.open(report.pdf_url, '_blank')}
                    onDelete={handleDeleteReport}
                    onMove={handleMoveReport}
                    folders={folders}
                  />
                ))}
              </div>
            ) : (
              // Group by folder when viewing All Folders
              <FolderGroupedReports 
                reports={filteredReports}
                onViewReport={(report) => window.open(report.pdf_url, '_blank')}
                onDeleteReport={handleDeleteReport}
                onMoveReport={handleMoveReport}
                folders={folders}
              />
            )
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Summary
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Folder
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr
                      key={report.id}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-blue-600">{report.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {report.summary?.substring(0, 100)}{report.summary?.length > 100 ? '...' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm">{report.folder_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2 items-center">
                          <button
                            onClick={() => window.open(report.pdf_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                          {/* Move dropdown for table view */}
                          <div className="relative group">
                            <button className="text-orange-600 hover:text-orange-800">
                              Move ▾
                            </button>
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20 hidden group-hover:block">
                              <div className="py-1">
                                <button
                                  onClick={() => handleMoveReport(report.id, null)}
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                                    report.folder_id === null ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                  }`}
                                >
                                  📁 Uncategorized
                                </button>
                                {folders.map((folder) => (
                                  <button
                                    key={folder.id}
                                    onClick={() => handleMoveReport(report.id, folder.id)}
                                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                                      report.folder_id === folder.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                    }`}
                                  >
                                    📁 {folder.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="p-5">
          <h2 className="text-xl font-semibold mb-4">Reports</h2>
          <ReportList folderId={activeFolder} />
        </div>
      )}
        </div>
      </div>
      
      {/* Drag feedback notification */}
      {dragFeedback && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${dragFeedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${dragFeedback.type === 'success' ? 'text-green-500' : 'text-red-500'} mr-2`} viewBox="0 0 20 20" fill="currentColor">
              {dragFeedback.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              )}
            </svg>
            {dragFeedback.message}
          </div>
        </div>
      )}
      

    </DndContext>
  )
}
