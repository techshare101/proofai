'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ReportCard, { Report } from '../components/dashboard/ReportCard'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import EmptyState from '../components/dashboard/EmptyState'
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton'
import PDFViewerModal from '../components/dashboard/PDFViewerModal'
import { insertDummyReport } from '../utils/insertDummyReport'
import ReportList from '../components/ReportList'
import { fetchReportsByFolder } from '../../supabase/fetchReportsByFolder'
import { Switch } from '@headlessui/react'
import { FaTable, FaThLarge } from 'react-icons/fa'
import { HiOutlineDocument } from 'react-icons/hi'
import FolderGroupedReports from '../components/dashboard/FolderGroupedReports'

export default function DashboardPage() {
  const { session } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
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

  // Fetch reports when session changes
  useEffect(() => {
    if (session?.user && !activeFolder) {
      fetchReports()
    }
  }, [session, activeFolder])
  
  // Set isBrowser to true after component mount for portal support
  useEffect(() => {
    setIsBrowser(true)
  }, [])
  
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
            id, title, summary, pdf_url, folder_id, created_at,
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
  
  const handleDeleteReport = async (reportId: string) => {
    try {
      // Store original reports for potential rollback
      const originalReports = [...reports];
      
      // Show loading toast
      const loadingToast = toast.loading("Deleting report...");
      
      console.log(`[GridPurge-GRID] Starting deletion process for report: ${reportId}`);
      
      // STEP 0: RADICAL OPTIMISTIC UI UPDATE - Remove from UI immediately
      console.log(`[GridPurge-GRID] RADICAL UI UPDATE: Removing report ${reportId} instantly`);
      
      // Get the report we're deleting for visual feedback
      const reportToDelete = reports.find(r => r.id === reportId);
      
      // Apply a fade-out effect by updating UI state immediately
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      
      // STEP 1: Find the report to get file URLs before deletion
      console.log(`[GridPurge-GRID] Fetching report data to get file URLs...`);
      const { data: reportData, error: fetchError } = await supabase
        .from('reports')
        .select('id, pdf_url, file_url')
        .eq('id', reportId)
        .single();
      
      if (fetchError) {
        console.error(`[GridPurge-GRID] Failed to fetch report data:`, fetchError);
        toast.error(`Could not find report: ${fetchError.message}`, { id: loadingToast });
        return false;
      }
      
      console.log(`[GridPurge-GRID] Found report:`, reportData);
      
      // STEP 2: Delete PDF from storage if it exists
      if (reportData.pdf_url) {
        try {
          console.log(`[GridPurge-GRID] Deleting PDF: ${reportData.pdf_url}`);
          
          // Extract path from URL if it's a full URL
          let pdfPath = reportData.pdf_url;
          if (pdfPath.startsWith('http')) {
            try {
              const url = new URL(pdfPath);
              const pathParts = url.pathname.split('/');
              // Last part is usually the filename
              if (pathParts.length >= 1) {
                pdfPath = pathParts[pathParts.length - 1];
                console.log(`[GridPurge-GRID] Extracted PDF path: ${pdfPath}`);
              }
            } catch (e) {
              console.error('[GridPurge-GRID] Could not parse PDF URL', e);
            }
          }
          
          // Try multiple buckets to ensure PDF deletion
          const buckets = ['proofai-pdfs', 'pdfs', 'reports', 'public'];
          for (const bucket of buckets) {
            try {
              const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove([pdfPath]);
                
              if (!deleteError) {
                console.log(`[GridPurge-GRID] Successfully deleted PDF from ${bucket}`);
                break; // Stop if successful
              }
            } catch (e) {
              console.log(`[GridPurge-GRID] Error deleting PDF from ${bucket}:`, e);
            }
          }
        } catch (pdfError) {
          console.error('[GridPurge-GRID] Error deleting PDF:', pdfError);
          // Continue even if PDF deletion fails
        }
      }
      
      // Delete other file from storage if it exists
      if (reportData.file_url) {
        try {
          console.log(`[GridPurge-GRID] Deleting file: ${reportData.file_url}`);
          
          // Extract path from URL if it's a full URL
          let filePath = reportData.file_url;
          if (filePath.startsWith('http')) {
            try {
              const url = new URL(filePath);
              const pathParts = url.pathname.split('/');
              // Last part is usually the filename
              if (pathParts.length >= 1) {
                filePath = pathParts[pathParts.length - 1];
                console.log(`[GridPurge-GRID] Extracted file path: ${filePath}`);
              }
            } catch (e) {
              console.error('[GridPurge-GRID] Could not parse file URL', e);
            }
          }
          
          // Try multiple buckets to ensure file deletion
          const buckets = ['recordings', 'files', 'reports', 'uploads', 'audio'];
          for (const bucket of buckets) {
            try {
              const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove([filePath]);
                
              if (!deleteError) {
                console.log(`[GridPurge-GRID] Successfully deleted file from ${bucket}`);
                break; // Stop if successful
              }
            } catch (e) {
              console.log(`[GridPurge-GRID] Error deleting file from ${bucket}:`, e);
            }
          }
        } catch (fileError) {
          console.error('[GridPurge-GRID] Error deleting file:', fileError);
          // Continue even if file deletion fails
        }
      }
      
      // STEP 3: Confirm UI state is updated
      console.log(`[GridPurge-GRID] UI state already updated optimistically...`);
      
      // STEP 4: Delete from database
      console.log(`[GridPurge-GRID] Deleting report from database: ${reportId}`);
      const { data, error, status } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
      
      // Log full response details for debugging
      console.log(`[GridPurge-GRID] Database delete response:`, { 
        data, error, status,
        fullError: error ? JSON.stringify(error) : 'none'
      });
      
      if (error) {
        // Rollback UI update if database deletion fails
        console.error(`[GridPurge-GRID] Delete failed:`, error);
        setReports(originalReports);
        toast.error(`Delete failed: ${error.message}`, { id: loadingToast });
        return false;
      }
      
      console.log(`[GridPurge-GRID] Report deleted from database successfully`);
      
      // STEP 5: Clean up any empty folders
      try {
        // Get all folders
        const { data: folders, error: foldersError } = await supabase
          .from('folders')
          .select('id, name');
          
        if (foldersError) throw foldersError;
        
        // For each folder, check if it has any reports
        for (const folder of folders || []) {
          // Skip the Uncategorized folder
          if (folder.name === 'Uncategorized') continue;
          
          // Count reports in this folder
          const { count, error: countError } = await supabase
            .from('reports')
            .select('id', { count: 'exact' })
            .eq('folder_id', folder.id);
          
          if (countError) throw countError;
          
          // If no reports, delete the folder
          if (count === 0) {
            console.log(`[GridPurge-GRID] Removing empty folder: ${folder.name}`);
            const { error: deleteError } = await supabase
              .from('folders')
              .delete()
              .eq('id', folder.id);
              
            if (deleteError) throw deleteError;
          }
        }
      } catch (folderError) {
        console.error('[GridPurge-GRID] Error cleaning up folders:', folderError);
        // We don't revert the report deletion even if folder cleanup fails
      }
      
      // Success notification
      toast.success("Report and associated files deleted successfully", { id: loadingToast });
      
      // STEP 6: Force refresh data from server
      console.log(`[GridPurge-GRID] Refreshing data from server...`);
      fetchReports();
      return true;
    } catch (err) {
      console.error('[GridPurge-GRID] Uncaught error in handleDeleteReport:', err);
      toast.error(`Delete failed: ${err?.message || "Something went wrong"}`);
      return false;
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
        <h1 className="text-2xl font-bold">Your Reports</h1>
        <p className="text-gray-600">Manage and view your PDF reports</p>
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
                  />
                ))}
              </div>
            ) : (
              // Group by folder when viewing All Folders
              <FolderGroupedReports 
                reports={filteredReports}
                onViewReport={(report) => window.open(report.pdf_url, '_blank')}
                onDeleteReport={handleDeleteReport}
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
                        <div className="flex space-x-2">
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
