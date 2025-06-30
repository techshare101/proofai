'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegFilePdf, FaTimes, FaMapMarkerAlt, FaRegClock } from 'react-icons/fa';
import { formatDate, formatRelativeTime, Report } from './utils';
import { toast } from 'react-hot-toast';

interface ReportViewModalProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewModal({ report, onClose }: ReportViewModalProps) {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  // Close on escape key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Handle file view with validation
  const handleFileView = () => {
    if (!report.file_url || report.file_url.trim() === '') {
      toast.error("No file available for download");
      return;
    }

    setIsLoadingFile(true);
    
    // Format URL properly
    const fileUrl = report.file_url.startsWith('http') 
      ? report.file_url 
      : `https://${report.file_url.replace(/^\/*/, '')}`;
    
    // Open in new tab
    window.open(fileUrl, '_blank');
    setIsLoadingFile(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <FaRegFilePdf className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
            </div>
            <button 
              onClick={onClose}
              className="bg-white rounded-md p-2 hover:bg-gray-100 focus:outline-none"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4">
            <h2 className="text-xl font-bold mb-2">{report.title}</h2>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span className="flex items-center mr-4">
                <FaMapMarkerAlt className="mr-1 h-4 w-4" />
                {report.location || 'No location'}
              </span>
              <span className="flex items-center">
                <FaRegClock className="mr-1 h-4 w-4" />
                {formatDate(report.created_at)} ({formatRelativeTime(report.created_at)})
              </span>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-2">Summary</h3>
              <div className="bg-gray-50 p-3 rounded-md text-gray-800">
                {report.summary || 'No summary available'}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-2">Folder</h3>
              <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                {report.folder_name || 'Uncategorized'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-2">Original Transcript</h3>
                <div className="bg-gray-50 p-3 rounded-md text-gray-800 max-h-48 overflow-y-auto">
                  {report.original_transcript || 'No original transcript available'}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-2">Translated Transcript</h3>
                <div className="bg-gray-50 p-3 rounded-md text-gray-800 max-h-48 overflow-y-auto">
                  {report.translated_transcript || 'No translated transcript available'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            {report.file_url && report.file_url.trim() !== '' && (
              <button 
                onClick={handleFileView}
                disabled={isLoadingFile}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                {isLoadingFile ? 'Loading...' : 'View File'}
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
