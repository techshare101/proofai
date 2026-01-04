'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronRight, FaFileAlt, FaDownload, FaFolder, FaFolderOpen, FaFilePdf, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import TranscriptToggle from './TranscriptToggle';
import ReportModal from './ReportModal';
import { deleteReportWithFiles } from './ReportDeleteHandler';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Report type definition
interface Report {
  id: string;
  title: string;
  summary?: string;
  location?: string;
  created_at: string;
  folder_id?: string;
  folder_name?: string;
  original_transcript?: string;
  translated_transcript?: string;
  author_name?: string;
  status?: string;
  file_url?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
}

// Folder type definition
interface Folder {
  id: string;
  name: string;
  color?: string;
  reports: Report[];
  isExpanded: boolean;
  displayCount: number; // For pagination
}

interface FolderGroupedDashboardProps {
  userId: string;
}

export default function FolderGroupedDashboard({ userId }: FolderGroupedDashboardProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // State
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  
  // Fetch reports grouped by folder
  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      
      try {
        // Fetch reports with folder information
        const { data: reports, error } = await supabase
          .from('reports')
          .select(`
            id, title, summary, location, created_at,
            folder_id, folders(id, name),
            original_transcript, translated_transcript,
            author_name, status, file_url,
            pdf_url, pdf_generated_at
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform reports data to add folder_name property
        const transformedReports = reports.map((report: any) => ({
          ...report,
          folder_name: report.folders?.name || 'Uncategorized',
          folder_id: report.folders?.id || null
        }));
        
        // Group reports by folder
        const groupedByFolder: { [key: string]: Report[] } = {};
        transformedReports.forEach((report: Report) => {
          const folderName = report.folder_name || 'Uncategorized';
          const folderId = report.folder_id || 'uncategorized';
          
          if (!groupedByFolder[folderId]) {
            groupedByFolder[folderId] = [];
          }
          
          groupedByFolder[folderId].push(report);
        });
        
        // Create folder objects
        const folderArray: Folder[] = Object.entries(groupedByFolder).map(([folderId, reports]) => ({
          id: folderId,
          name: reports[0].folder_name || 'Uncategorized',
          reports,
          isExpanded: false, // Initially collapsed
          displayCount: 10, // Initially display 10 reports
        }));
        
        setFolders(folderArray);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchReports();
    }
  }, [userId, supabase]);
  
  // Toggle folder expanded state
  const toggleFolder = (folderId: string) => {
    setFolders(prevFolders => 
      prevFolders.map(folder => 
        folder.id === folderId 
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };
  
  // Load more reports in a folder
  const loadMoreReports = (folderId: string) => {
    setFolders(prevFolders => 
      prevFolders.map(folder => 
        folder.id === folderId 
          ? { ...folder, displayCount: folder.displayCount + 10 }
          : folder
      )
    );
  };
  
  // Open report modal
  const openReportModal = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };
  
  // Close report modal
  const closeReportModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle report deletion and update UI
  const handleReportDelete = async (reportId: string) => {
    try {
      const success = await deleteReportWithFiles(reportId);
      
      if (success) {
        // Update folders state to remove the deleted report
        setFolders(prevFolders => 
          prevFolders.map(folder => ({
            ...folder,
            reports: folder.reports.filter(report => report.id !== reportId),
          }))
        );
        
        // Close modal if the deleted report was open
        if (selectedReport && selectedReport.id === reportId) {
          closeReportModal();
        }
        
        toast.success('Report deleted successfully');
      }
    } catch (error) {
      console.error('Error in handleReportDelete:', error);
      toast.error('Failed to delete report');
    }
  };
  
  // Export all reports to CSV
  const exportAllReports = () => {
    setExportingCsv(true);
    try {
      const allReports = folders.flatMap(folder => folder.reports);
      exportReportsToCSV(allReports, 'All_Reports');
      toast.success('All reports exported successfully!');
    } catch (error) {
      console.error('Error exporting all reports:', error);
      toast.error('Failed to export reports');
    } finally {
      setExportingCsv(false);
    }
  };
  
  // Export reports from a specific folder to CSV
  const exportFolderReports = (folder: Folder) => {
    try {
      exportReportsToCSV(folder.reports, folder.name);
      toast.success(`Reports from ${folder.name} exported successfully!`);
    } catch (error) {
      console.error(`Error exporting ${folder.name} reports:`, error);
      toast.error(`Failed to export reports from ${folder.name}`);
    }
  };
  
  // Helper function to export reports to CSV
  const exportReportsToCSV = (reports: Report[], filename: string) => {
    // Format data for export
    const data = reports.map(report => ({
      Title: report.title,
      Summary: report.summary || '',
      Location: report.location || '',
      Date: new Date(report.created_at).toLocaleDateString(),
      Time: new Date(report.created_at).toLocaleTimeString(),
      Folder: report.folder_name || 'Uncategorized',
      Status: report.status || '',
      Author: report.author_name || '',
      'Original Transcript': report.original_transcript || '',
      'Translated Transcript': report.translated_transcript || ''
    }));
    
    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const fullFilename = `ProofAI_${filename.replace(/\s+/g, '_')}_${date}.xlsx`;
    
    // Export file
    XLSX.writeFile(workbook, fullFilename);
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reports Dashboard
        </h1>
        <motion.button
          onClick={exportAllReports}
          disabled={exportingCsv || loading || folders.length === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors
            ${(exportingCsv || loading || folders.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaDownload className="mr-2" />
          {exportingCsv ? 'Exporting...' : 'Export All Reports'}
        </motion.button>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && folders.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center"
        >
          <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new report or importing existing ones.
          </p>
        </motion.div>
      )}
      
      {/* Folder list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="space-y-4"
      >
        {folders.map((folder, index) => {
          // Configure swipe handlers for mobile
          const swipeHandlers = useSwipeable({
            onSwipedRight: () => toggleFolder(folder.id),
            onSwipedLeft: () => toggleFolder(folder.id),
            trackMouse: true
          });
          
          return (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              {/* Folder header */}
              <motion.div 
                onClick={() => toggleFolder(folder.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                {...swipeHandlers}
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: folder.isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {folder.isExpanded ? (
                      <FaChevronDown className="text-gray-400 dark:text-gray-500" />
                    ) : (
                      <FaChevronRight className="text-gray-400 dark:text-gray-500" />
                    )}
                  </motion.div>
                  
                  <motion.div 
                    animate={{ 
                      scale: folder.isExpanded ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    {folder.isExpanded ? (
                      <FaFolderOpen className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <FaFolder className="h-5 w-5 text-yellow-400" />
                    )}
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {folder.name}
                    </span>
                  </motion.div>
                  
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                    {folder.reports.length}
                  </span>
                </div>
                
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportFolderReports(folder);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <FaDownload className="h-4 w-4" />
                </motion.button>
              </motion.div>
              
              {/* Reports list */}
              <AnimatePresence>
                {folder.isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {folder.reports.slice(0, folder.displayCount).map((report, idx) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md hover:shadow-md cursor-pointer transition-shadow"
                          onClick={() => openReportModal(report)}
                          whileHover={{ scale: 1.01 }}
                        >
                          {/* Report card content */}
                          <div className="relative">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium text-gray-900 dark:text-white">{report.title}</h3>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this report?')) {
                                    handleReportDelete(report.id);
                                  }
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete report"
                              >
                                <FaTrash className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {report.summary && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                {report.summary}
                              </p>
                            )}
                            
                            {/* Location display */}
                            {report.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                <FaMapMarkerAlt className="h-3 w-3 mr-1 text-red-500" />
                                {report.location}
                              </p>
                            )}
                            
                            {/* PDF status and download */}
                            <div className="flex justify-between items-center mt-1">
                              {/* Created date */}
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(report.created_at)}
                              </p>
                                                            {/* PDF indicator */}
                              {report.pdf_url ? (
                                (() => {
                                  // Get proper public URL if this is a storage path
                                  let pdfUrl = report.pdf_url;
                                  
                                  // Skip empty URLs
                                  if (!pdfUrl) return null;
                                  
                                  if (pdfUrl.startsWith('http')) {
                                    // Already a full URL
                                    return (
                                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" 
                                        className="text-xs text-green-600 dark:text-green-400 flex items-center"
                                        onClick={(e) => e.stopPropagation()}>  
                                        <FaFilePdf className="h-3 w-3 mr-1" />
                                        PDF
                                      </a>
                                    );
                                  }
                                  
                                  // For storage paths, try multiple buckets
                                  const buckets = ['proofai-pdfs', 'pdfs', 'reports', 'public'];
                                  
                                  // Remove any leading slashes for storage path
                                  while (pdfUrl.startsWith('/')) {
                                    pdfUrl = pdfUrl.substring(1);
                                  }
                                  
                                  // We'll display the link even if we can't validate it exists
                                  // Using the first bucket as default
                                  const { data } = supabase
                                    .storage
                                    .from(buckets[0])
                                    .getPublicUrl(pdfUrl);
                                  
                                  return (
                                    <a href={data.publicUrl} target="_blank" rel="noopener noreferrer" 
                                      className="text-xs text-green-600 dark:text-green-400 flex items-center"
                                      onClick={(e) => e.stopPropagation()}>  
                                      <FaFilePdf className="h-3 w-3 mr-1" />
                                      PDF
                                    </a>
                                  );
                                })()
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                  <FaFilePdf className="h-3 w-3 mr-1" />
                                  No PDF
                                </span>
                              )}
                            </div>
                            
                            {/* TranscriptToggle component - conditionally render if either transcript exists */}
                            {(report.original_transcript || report.translated_transcript) && (
                              <TranscriptToggle
                                original={report.original_transcript || ''}
                                translated={report.translated_transcript || ''}
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Load more button */}
                      {folder.reports.length > folder.displayCount && (
                        <motion.button
                          onClick={() => loadMoreReports(folder.id)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          Load More ({folder.reports.length - folder.displayCount} remaining)
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Report Modal */}
      {selectedReport && (
        <ReportModal 
          report={selectedReport} 
          isOpen={isModalOpen} 
          onClose={closeReportModal} 
          onDelete={handleReportDelete}
        />
      )}
    </div>
  );
}
