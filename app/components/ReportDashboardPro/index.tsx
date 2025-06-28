'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, Report, FolderGroup, groupReportsByFolder } from './utils';
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
        
        return {
          id: item.id,
          title: item.title || 'Untitled',
          summary: item.summary || 'No summary available',
          location: item.location || '',
          file_url: item.file_url || '',
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
  const handleDeleteReport = (id: string) => {
    // Optimistic UI update
    setReports(prev => prev.filter(report => report.id !== id));
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
