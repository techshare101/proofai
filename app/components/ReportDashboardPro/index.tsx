'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, Report, FolderGroup, groupReportsByFolder, formatDate } from './utils';
import FiltersBar from './FiltersBar';
import FolderSection from './FolderSection';

// Modal components
import ReportViewModal from './ReportViewModal';
import ReportEditModal from './ReportEditModal';

export interface ReportDashboardProProps {
  userId?: string;
}

export default function ReportDashboardPro({ userId }: ReportDashboardProProps) {
  // State management
  const [reports, setReports] = useState<Report[]>([]);
  const [folderGroups, setFolderGroups] = useState<FolderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modals
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [editReport, setEditReport] = useState<Report | null>(null);
  
  // List of unique folder names
  const folderNames = Array.from(new Set(reports.map(r => r.folder_name).filter(Boolean)));
  
  // Fetch reports on initial load
  useEffect(() => {
    fetchReports();
  }, [userId]);
  
  // Apply filters and update folderGroups
  useEffect(() => {
    const filtered = applyFilters(reports);
    const groups = groupReportsByFolder(filtered);
    setFolderGroups(groups);
    
    // Reset pagination when filters change
    setCurrentPage(1);
  }, [reports, searchQuery, folderFilter, dateFilter]);
  
  // Fetch reports from Supabase
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query to fetch reports joined with folders
      let query = supabase
        .from('reports')
        .select(`
          id, title, summary, location, file_url, 
          original_transcript, translated_transcript,
          created_at, folder_id,
          folders (name)
        `)
        .order('created_at', { ascending: false });
      
      // Add user filter if provided
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format data from Supabase nested structure
      const formattedReports: Report[] = (data || []).map((item: any) => {
        // Extract folder name from nested join
        const folderName = item.folders?.name || 'Uncategorized';
        
        // Generate a meaningful title from available data
        let title = item.title;
        if (!title || title === 'Proof Report' || title === 'Untitled') {
          // Try to use caseId if available
          if (item.case_id) {
            title = `Case ${item.case_id}`;
          } 
          // Otherwise use part of the summary
          else if (item.summary && item.summary.length > 0) {
            const summaryPreview = item.summary.substring(0, 30);
            title = `${summaryPreview}${item.summary.length > 30 ? '...' : ''}`;
          }
          // Last resort - use date
          else {
            const dateStr = item.created_at ? formatDate(item.created_at) : 'Unknown Date';
            title = `Report - ${dateStr}`;
          }
        }
        
        return {
          id: item.id,
          title: title,
          summary: item.summary || 'No summary available',
          location: item.location || '',
          file_url: item.file_url && item.file_url !== 'null' ? item.file_url : '',
          original_transcript: item.original_transcript || '',
          translated_transcript: item.translated_transcript || '',
          folder_id: item.folder_id || null,
          folder_name: folderName,
          created_at: item.created_at
        };
      });
      
      setReports(formattedReports);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to load reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply all filters to reports
  const applyFilters = (reports: Report[]): Report[] => {
    return reports.filter(report => {
      const matchesSearch = !searchQuery || 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFolder = !folderFilter || report.folder_name === folderFilter;
      
      const matchesDate = !dateFilter || new Date(report.created_at) >= new Date(dateFilter);
      
      return matchesSearch && matchesFolder && matchesDate;
    });
  };
  
  // Toggle folder expand/collapse
  const toggleFolderExpand = (folderId: string) => {
    setFolderGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === folderId 
          ? { ...group, isExpanded: !group.isExpanded } 
          : group
      )
    );
  };
  
  // Delete report handler
  // Cleanup empty folders after deletion
  const cleanupEmptyFolders = (updatedGroups: FolderGroup[]) => {
    // Filter out any folder groups with zero reports
    return updatedGroups.filter(group => {
      // Keep the 'Uncategorized' folder even if empty
      if (group.name === 'Uncategorized') return true;
      
      // Remove other folders if they're empty
      return group.reports.length > 0;
    });
  };
  
  // Delete report handler
  const handleDeleteReport = async (id: string) => {
    try {
      // Store previous state for rollback if needed
      const previousReports = [...reports];
      const previousFolderGroups = [...folderGroups];
      
      // Show loading toast
      const loadingToast = toast.loading("Deleting report...");
      
      console.log(`[GridPurge-FINAL] Starting deletion process for report: ${id}`);
      
      // STEP 0: RADICAL OPTIMISTIC UI UPDATE - Remove from UI immediately
      console.log(`[GridPurge-FINAL] Radical UI update - removing report ${id} immediately`);
      
      // Update reports state immediately
      const updatedReports = previousReports.filter(report => report.id !== id);
      setReports(updatedReports);
      
      // Update folder groups immediately with a visual effect
      const updatedGroups = previousFolderGroups.map(group => ({
        ...group,
        reports: group.reports.filter(report => report.id !== id)
      }));
      
      // Apply cleanup immediately to make empty folders disappear
      const cleanedGroups = cleanupEmptyFolders(updatedGroups);
      setFolderGroups(cleanedGroups);
      
      // STEP 1: Find the report to get file URLs before deletion
      console.log(`[GridPurge-FINAL] Fetching report data to get file URLs...`);
      const { data: reportData, error: fetchError } = await supabase
        .from('reports')
        .select('id, file_url, pdf_url')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error(`[GridPurge-FINAL] Failed to fetch report data:`, fetchError);
        // Rollback UI changes if we can't find the report
        setReports(previousReports);
        setFolderGroups(previousFolderGroups);
        toast.error(`Could not find report: ${fetchError.message}`, { id: loadingToast });
        return false;
      }
      
      console.log(`[GridPurge-FINAL] Found report:`, reportData);
      
      // STEP 2: Delete files from storage first
      if (reportData.file_url) {
        try {
          console.log(`[GridPurge-FINAL] Deleting file: ${reportData.file_url}`);
          
          // Extract path from URL if it's a full URL
          let filePath = reportData.file_url;
          if (filePath.startsWith('http')) {
            try {
              const url = new URL(filePath);
              const pathParts = url.pathname.split('/');
              // Last part is usually the filename
              if (pathParts.length >= 1) {
                filePath = pathParts[pathParts.length - 1];
                console.log(`[GridPurge-FINAL] Extracted file path: ${filePath}`);
              }
            } catch (e) {
              console.error('[GridPurge-FINAL] Could not parse file URL', e);
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
                console.log(`[GridPurge-FINAL] Successfully deleted file from ${bucket}`);
                break; // Stop if successful
              }
            } catch (e) {
              console.log(`[GridPurge-FINAL] Error deleting file from ${bucket}:`, e);
            }
          }
        } catch (fileError) {
          console.error('[GridPurge-FINAL] Error deleting file:', fileError);
          // Continue even if file deletion fails
        }
      }
      
      // Delete PDF from storage if it exists
      if (reportData.pdf_url) {
        try {
          console.log(`[GridPurge-FINAL] Deleting PDF: ${reportData.pdf_url}`);
          
          // Extract path from URL if it's a full URL
          let pdfPath = reportData.pdf_url;
          if (pdfPath.startsWith('http')) {
            try {
              const url = new URL(pdfPath);
              const pathParts = url.pathname.split('/');
              // Last part is usually the filename
              if (pathParts.length >= 1) {
                pdfPath = pathParts[pathParts.length - 1];
                console.log(`[GridPurge-FINAL] Extracted PDF path: ${pdfPath}`);
              }
            } catch (e) {
              console.error('[GridPurge-FINAL] Could not parse PDF URL', e);
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
                console.log(`[GridPurge-FINAL] Successfully deleted PDF from ${bucket}`);
                break; // Stop if successful
              }
            } catch (e) {
              console.log(`[GridPurge-FINAL] Error deleting PDF from ${bucket}:`, e);
            }
          }
        } catch (pdfError) {
          console.error('[GridPurge-FINAL] Error deleting PDF:', pdfError);
          // Continue even if PDF deletion fails
        }
      }
      
      // STEP 3: Now delete the report from the database
      console.log(`[GridPurge-FINAL] Deleting report from database: ${id}`);
      const { data, error, status } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      // Log full response details for debugging
      console.log(`[GridPurge-FINAL] Database delete response:`, { 
        data, error, status,
        fullError: error ? JSON.stringify(error) : 'none'
      });
      
      if (error) {
        console.error(`[GridPurge-FINAL] Database deletion failed:`, error);
        // Rollback UI state
        setReports(previousReports);
        setFolderGroups(previousFolderGroups);
        toast.error(`Delete failed: ${error.message}`, { id: loadingToast });
        return false;
      }
      
      // STEP 4: Confirm UI state is updated after successful deletion
      console.log(`[GridPurge-FINAL] Database deletion successful, UI already updated...`);
      
      // Log folders that were cleaned up
      const removedFolders = updatedGroups.filter(g => 
        !cleanedGroups.some(cg => cg.id === g.id)
      ).map(g => g.name);
      
      if (removedFolders.length > 0) {
        console.log(`[GridPurge-FINAL] Removed empty folders:`, removedFolders);
      }
      
      // Show success toast
      toast.success("Report and associated files deleted successfully", { id: loadingToast });
      
      // STEP 6: Force refresh data from server
      console.log(`[GridPurge-FINAL] Refreshing data from server...`);
      fetchReports();
      
      return true;
    } catch (err: any) {
      console.error('[GridPurge-FINAL] Uncaught error in handleDeleteReport:', err);
      toast.error(`Delete failed: ${err?.message || "Something went wrong"}`);
      return false;
    }
  };
  
  // Calculate total number of reports after filtering
  const filteredReportCount = folderGroups.reduce(
    (total, group) => total + group.reports.length, 0
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredReportCount / itemsPerPage);
  
  // Generate pagination buttons
  const paginationButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationButtons.push(
      <button
        key={i}
        onClick={() => setCurrentPage(i)}
        className={`px-3 py-1 mx-1 rounded ${
          currentPage === i
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-right" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <p className="text-gray-600">View, filter, and manage your reports</p>
      </motion.div>
      
      <FiltersBar
        folderNames={folderNames}
        reports={reports}
        onSearch={setSearchQuery}
        onFolderFilter={setFolderFilter}
        onDateFilter={setDateFilter}
      />
      
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center py-12"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 p-4 border border-red-200"
        >
          <p className="text-red-600">{error}</p>
        </motion.div>
      ) : folderGroups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery || folderFilter || dateFilter ? 
              'Try adjusting your filters to see more results' : 
              'Create your first report to get started'}
          </p>
        </motion.div>
      ) : (
        <>
          <AnimatePresence>
            {folderGroups.map(folderGroup => (
              <FolderSection
                key={folderGroup.id}
                folderGroup={folderGroup}
                toggleFolderExpand={toggleFolderExpand}
                onDeleteReport={handleDeleteReport}
                onEditReport={setEditReport}
                onViewReport={setViewReport}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            ))}
          </AnimatePresence>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-l bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              {paginationButtons}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-r bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Modals */}
      {viewReport && (
        <ReportViewModal report={viewReport} onClose={() => setViewReport(null)} />
      )}
      
      {editReport && (
        <ReportEditModal 
          report={editReport} 
          onClose={() => setEditReport(null)}
          onSave={(updatedReport) => {
            // Update reports with the edited version
            setReports(prev => 
              prev.map(r => r.id === updatedReport.id ? updatedReport : r)
            );
            setEditReport(null);
            toast.success('Report updated successfully');
          }} 
        />
      )}
    </div>
  );
}
