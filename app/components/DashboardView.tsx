'use client';

import { useEffect, useState } from 'react';
import { Trash2, FileText, Video, Loader2, RefreshCw, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Report {
  id?: string;
  title: string;
  file_url: string;
  record_url?: string;
  folder?: string;
  created_at: string;
  summary?: string;
  folder_id?: string;
  folder_name?: string;
  pdf_url?: string;
  user_id?: string;
}

// Define Report type
interface Report {
  id: string;
  title: string;
  summary: string;
  pdf_url: string;
  file_url?: string; // Added file_url for video recordings
  folder_id?: string;
  folder_name?: string;
  created_at: string;
}

interface DragFeedback {
  message: string;
  type: 'success' | 'error';
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [dragFeedback, setDragFeedback] = useState<DragFeedback | null>(null);
  const [cardView, setCardView] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [showFolderFilter, setShowFolderFilter] = useState(false);

  // Function to load reports from database
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('reports')
        .select(`
          id,
          title,
          summary,
          pdf_url,
          file_url,
          created_at,
          folder_id,
          folder_name,
          folders(name)
        `);

      // Apply folder filter if active
      if (activeFolder) {
        query = query.eq('folder_name', activeFolder);
      }

      // Execute the query
      const { data: allData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (allData) {
        const formattedReports = allData.map((item) => {
          const folderName = item.folder_name || 
            (Array.isArray(item.folders) && item.folders.length > 0
              ? item.folders[0]?.name
              : (item.folders as any)?.name) || 'Uncategorized';

          return {
            id: item.id,
            title: item.title || 'Untitled Report',
            summary: item.summary || 'No summary available',
            pdf_url: item.pdf_url,
            file_url: item.file_url,
            folder_id: item.folder_id,
            folder_name: folderName,
            created_at: item.created_at,
          };
        });

        setReports(formattedReports);
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [activeFolder]);

  // Load reports and folders when component mounts or activeFolder changes
  useEffect(() => {
    const loadData = async () => {
      await loadReports();
      
      // Load folders for the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const userFolders = await getFoldersForUser(user.id);
        setFolders(userFolders as string[]);
      }
    };
    
    loadData();
  }, [loadReports]);
  
  // Function for manual refresh of reports
  const fetchReports = async () => {
    await loadReports();
    
    // Refresh folders list
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const userFolders = await getFoldersForUser(user.id);
      setFolders(userFolders as string[]);
    }
  };
  
  // Function to handle folder deletion
  const handleDeleteFolder = async (folderId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this folder? All its contents will be unlinked.');
    if (!confirmDelete) return;
    
    toast.loading('Deleting folder...', { id: 'deleteFolder' });
    // Use the comprehensive deleteFolder function
    const result = await deleteFolder(folderId, '');
    
    if (result.success) {
      toast.success('Folder deleted successfully!', { id: 'deleteFolder' });
      setActiveFolder(null);
      fetchReports(); // refresh UI
    } else {
      toast.error(`Failed to delete folder: ${result.error}`, { id: 'deleteFolder' });
      console.error('[GridPurge] Folder delete error:', result.error);
    }
  };

  // Function to handle report deletion
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
      
      // Success notification
      toast.success("Report and associated files deleted successfully", { id: loadingToast });
      
      // STEP 6: Force refresh data from server
      console.log(`[GridPurge-GRID] Refreshing data from server...`);
      fetchReports();
      return true;
    } catch (err: any) {
      console.error('[GridPurge-GRID] Uncaught error in handleDeleteReport:', err);
      toast.error(`Delete failed: ${err?.message || "Something went wrong"}`);
      return false;
    }
  };

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
    folder?: string;
  }) => {
    const { query, dateRange, folder } = filters;
    
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
      
      // Folder filter (if activeFolder is set, it's already filtered in the query)
      const matchesFolder = !folder || report.folder_name === folder;
      
      return matchesSearch && matchesDate && matchesFolder;
    });
  };

  // Apply filters to get filtered reports
  const filteredReports = filterReports(reports, {
    query: searchQuery,
    dateRange: dateFilter,
    folder: activeFolder || undefined
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchReports();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📄 Your Reports</h1>
              {activeFolder && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFolder}
                  <button 
                    onClick={() => setActiveFolder(null)}
                    className="ml-1.5 text-blue-500 hover:text-blue-700"
                    aria-label="Clear folder filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">Manage and review your generated reports</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search bar with icon */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Date filter dropdown with icon */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">All time</option>
                <option value="recent">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* View Toggle */}
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setCardView(false)}
                  className={`px-3 py-2 text-sm font-medium rounded-l-lg border ${!cardView ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCardView(true)}
                  className={`px-3 py-2 text-sm font-medium rounded-r-lg border ${cardView ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              
              {/* Refresh button */}
              <button 
                onClick={() => fetchReports()} 
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {/* Upload button */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <span className="hidden sm:inline">Upload File</span>
                <Upload className="h-4 w-4" />
              </button>
              
              {/* Folder filter button */}
              <div className="relative">
                <button
                  onClick={() => setShowFolderFilter(!showFolderFilter)}
                  className={`px-3 py-2 flex items-center gap-1.5 border rounded-lg text-sm font-medium ${
                    activeFolder 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Folders</span>
                </button>
                
                {showFolderFilter && (
                  <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b">
                        Filter by folder
                      </div>
                      <button
                        onClick={() => {
                          setActiveFolder(null);
                          setShowFolderFilter(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          !activeFolder 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        role="menuitem"
                      >
                        All Folders
                      </button>
                      {folders.map((folder) => (
                        <button
                          key={folder}
                          onClick={() => {
                            setActiveFolder(folder);
                            setShowFolderFilter(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            activeFolder === folder 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          role="menuitem"
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Content */}
        {loading ? (
          // Loading state with skeleton cards
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-5/6 mb-4"></div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="h-8 bg-gray-100 rounded w-24"></div>
                    <div className="h-8 bg-gray-100 rounded w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          // Empty state
          <div className="text-center py-16 px-4 sm:px-6 lg:px-8 rounded-xl bg-white border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No reports</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? 'No reports match your search. Try adjusting your search criteria.'
                : 'Get started by creating a new recording.'}
            </p>
            <div className="mt-6">
              <a
                href="/recorder"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Recording
              </a>
            </div>
          </div>
        ) : cardView ? (
          // Card View
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <div key={report.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                      {report.title || 'Untitled Report'}
                    </h3>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-gray-400 hover:text-red-500 p-1 -mr-2 -mt-1 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Folder className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    <span className="truncate">{report.folder_name || 'Uncategorized'}</span>
                  </div>
                  
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3 flex-1">
                    {report.summary || 'No summary available'}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex space-x-2">
                      {report.pdf_url && (
                        <a
                          href={report.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          PDF
                        </a>
                      )}
                      {report.file_url ? (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5 mr-1.5" />
                          Video
                        </a>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white opacity-50 cursor-not-allowed">
                          <Video className="h-3.5 w-3.5 mr-1.5" />
                          No Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <li key={report.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {report.title || 'Untitled Report'}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Folder className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{report.folder_name || 'Uncategorized'}</span>
                            <span className="mx-1">•</span>
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {report.pdf_url && (
                        <a
                          href={report.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          PDF
                        </a>
                      )}
                      {report.file_url ? (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Video className="h-3.5 w-3.5 mr-1.5" />
                          Video
                        </a>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white opacity-50 cursor-not-allowed">
                          <Video className="h-3.5 w-3.5 mr-1.5" />
                          No Video
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Drag feedback */}
      {dragFeedback && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          dragFeedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {dragFeedback.type === 'success' ? (
            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span>{dragFeedback.message}</span>
        </div>
      )}
    </div>
    
    {/* Upload Modal */}
    {showUploadModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upload File</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {showUploadModal && (
              <ManualUpload 
                userId={supabase.auth.session()?.user?.id || ''}
                onUploadSuccess={handleUploadSuccess}
              />
            )}
          </div>
        </div>
      </div>
    )}
  );
}
