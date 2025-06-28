'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaRegClock, FaFolder, FaDownload, FaUser, FaFilePdf } from 'react-icons/fa';
import TranscriptToggle from './TranscriptToggle';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

interface ReportModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (reportId: string) => Promise<void>;
}

export default function ReportModal({ report, isOpen, onClose }: ReportModalProps) {
  const supabase = createClientComponentClient();
  const [showOriginal, setShowOriginal] = useState(false);
  const [validatedPdfUrl, setValidatedPdfUrl] = useState<string | null>(null);
  
  // Validate and process PDF URL when report changes
  useEffect(() => {
    async function validateAndProcessPdfUrl() {
      if (!report?.pdf_url) return;
      
      console.log('Raw PDF URL from database:', report.pdf_url);
      
      try {
        let pdfUrl = report.pdf_url;
        
        // Already a full URL
        if (pdfUrl.startsWith('http')) {
          console.log('PDF URL is already a full URL, using as-is');
          setValidatedPdfUrl(pdfUrl);
          return;
        }
        
        // Common buckets to try
        const buckets = ['proofai-pdfs', 'pdfs', 'reports', 'public'];
        
        // Remove any leading slashes for storage path
        while (pdfUrl.startsWith('/')) {
          pdfUrl = pdfUrl.substring(1);
        }
        
        console.log('Normalized storage path:', pdfUrl);
        
        // Try different bucket names until we find one that works
        for (const bucket of buckets) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(pdfUrl);
          console.log(`Trying bucket '${bucket}':`, data.publicUrl);
          
          // Check if URL exists (this is just a basic validation)
          try {
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log(`Found valid PDF in bucket '${bucket}'`);
              setValidatedPdfUrl(data.publicUrl);
              return;
            }
          } catch (error) {
            console.log(`Failed HEAD request for bucket '${bucket}'`);
          }
        }
        
        console.error('No valid PDF URL found after trying all buckets');
        setValidatedPdfUrl(null);
      } catch (error) {
        console.error('Error processing PDF URL:', error);
        setValidatedPdfUrl(null);
      }
    }
    
    if (report) {
      validateAndProcessPdfUrl();
    }
  }, [report, supabase]);
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [onClose]);
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{report.title}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FaTimes className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* PDF Status */}
              {report.pdf_url ? (
                <div className="mb-4 p-2 bg-green-50 dark:bg-green-900 border border-green-100 dark:border-green-800 rounded-md">
                  <div className="flex items-center">
                    <FaFilePdf className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    <span className="text-sm text-green-800 dark:text-green-200">
                      PDF available{report.pdf_generated_at ? ` (generated on ${new Date(report.pdf_generated_at).toLocaleDateString()})` : ''}
                    </span>
                    {validatedPdfUrl ? (
                      <a 
                        href={validatedPdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      >
                        <FaFilePdf className="mr-1 h-4 w-4" />
                        View PDF
                      </a>
                    ) : (
                      <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <FaFilePdf className="mr-1 h-4 w-4" />
                        PDF Link Unavailable
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-md">
                  <div className="flex items-center">
                    <FaFilePdf className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      No PDF available yet
                    </span>
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-gray-600 dark:text-gray-300">
                {report.folder_name && (
                  <div className="flex items-center">
                    <FaFolder className="mr-1 h-4 w-4 text-blue-500" />
                    <span>{report.folder_name}</span>
                  </div>
                )}
                
                {report.created_at && (
                  <div className="flex items-center">
                    <FaRegClock className="mr-1 h-4 w-4 text-gray-500" />
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                )}
                
                {report.location && (
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1 h-4 w-4 text-red-500" />
                    <span>{report.location}</span>
                  </div>
                )}
                
                {report.author_name && (
                  <div className="flex items-center">
                    <FaUser className="mr-1 h-4 w-4 text-gray-500" />
                    <span>{report.author_name}</span>
                  </div>
                )}
                
                {report.status && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {report.status.replace('_', ' ').toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Summary */}
              {report.summary && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Summary</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-200">
                    {report.summary}
                  </div>
                </div>
              )}
              
              {/* Transcript - using our custom toggle component */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Transcript</h3>
                <TranscriptToggle
                  original={report.original_transcript || 'No original transcript available'}
                  translated={report.translated_transcript || 'No translated transcript available'}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
              {report.file_url && (
                <motion.a
                  href={report.file_url}
                  download
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center mr-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaDownload className="mr-2 -ml-1 h-4 w-4" />
                  Download File
                </motion.a>
              )}
              
              {validatedPdfUrl && (
                <motion.a
                  href={validatedPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center mr-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaDownload className="mr-2 -ml-1 h-4 w-4" />
                  Download PDF
                </motion.a>
              )}
              
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
