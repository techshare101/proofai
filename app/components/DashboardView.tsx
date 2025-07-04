'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { deleteFolder } from '@/supabase/deleteFolder';
import { DragEndEvent } from '@dnd-kit/core';

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

  // Function to load reports from database using useEffect
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: allData, error } = await supabase
          .from('reports')
          .select(`
            id,
            title,
            summary,
            pdf_url,
            file_url,
            created_at,
            folder_id,
            folders(name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (allData) {
          const formattedReports = allData.map((item) => {
            const folderName = Array.isArray(item.folders) && item.folders.length > 0
              ? item.folders[0]?.name
              : (item.folders as any)?.name || 'Uncategorized';

            return {
              id: item.id,
              title: item.title || 'Untitled Report',
              summary: item.summary || 'No summary available',
              pdf_url: item.pdf_url,
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
    };

    loadReports();
  }, []);
  
  // Function for manual refresh of reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: allData, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          summary,
          pdf_url,
          file_url,
          created_at,
          folder_id,
          folders(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (allData) {
        const formattedReports = allData.map((item) => {
          const folderName = Array.isArray(item.folders) && item.folders.length > 0
            ? item.folders[0]?.name
            : (item.folders as any)?.name || 'Uncategorized';

          return {
            id: item.id,
            title: item.title || 'Untitled Report',
            summary: item.summary || 'No summary available',
            pdf_url: item.pdf_url,
            file_url: item.file_url, // Include file_url for video recordings
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
  });

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">ProofAI: Your Reports</h2>
        
        <div className="flex gap-2">
          {/* Recorder button */}
          <a
            href="/recorder"
            className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm flex items-center"
          >
            🎙️ Open Recorder
          </a>
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          
          {/* Date filter dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All time</option>
            <option value="recent">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          
          {/* Refresh button */}
          <button 
            onClick={() => fetchReports()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <p>Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reports found.</p>
          {searchQuery && <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-2">
              <h3 className="font-semibold text-lg">{report.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{report.summary || 'No summary available'}</p>
              <div className="text-xs text-gray-400">
                <span>Folder: {report.folder_name || 'Uncategorized'}</span>
                <span className="mx-2">•</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-2">
                    {report.pdf_url && (
                      <a href={report.pdf_url} target="_blank" className="text-blue-600 text-sm hover:underline">
                        📄 View PDF
                      </a>
                    )}
                    {report.file_url && (
                      <a href={report.file_url} target="_blank" className="text-green-600 text-sm hover:underline">
                        🎥 View Recording
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Drag feedback */}
      {dragFeedback && (
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg ${
          dragFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {dragFeedback.message}
        </div>
      )}
    </div>
  );
}
