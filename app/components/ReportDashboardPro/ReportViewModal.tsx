'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegFilePdf, FaTimes, FaMapMarkerAlt, FaRegClock } from 'react-icons/fa';
import { formatDate, formatRelativeTime, Report, supabase } from './utils';
import { toast } from 'react-hot-toast';

interface ReportViewModalProps {
  report: Report;
  onClose: () => void;
}

export default function ReportViewModal({ report, onClose }: ReportViewModalProps) {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  // Track if PDF is available - defaults to true if report has a file_url
  const [isPdfAvailable, setIsPdfAvailable] = useState(Boolean(report.file_url && report.file_url.trim() !== ''));
  
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

  // Generate fresh Supabase signed URL and open in new tab
  const handleFileView = async () => {
    if (!report.file_url || report.file_url.trim() === '') {
      toast.error("No file available for download");
      return;
    }

    setIsLoadingFile(true);
    console.log('[PDF View] Original file_url:', report.file_url);
    
    try {
      // Extract the file path from the URL - could be a full URL or just a path
      let filePath = report.file_url;
      let bucketName = '';
      let objectPath = '';
      
      // Log the file path we're working with
      console.log('[PDF View] Working with file path:', filePath);
      
      // CASE 1: Full Supabase URL with storage/v1/object
      if (filePath.includes('storage/v1/object')) {
        console.log('[PDF View] Case 1: Full Supabase storage URL detected');
        // Extract path from Supabase URL format
        const regex = /storage\/v1\/object\/(public|sign)\/([^?]+)/;
        const pathMatch = filePath.match(regex);
        
        if (pathMatch && pathMatch[2]) {
          const fullPath = pathMatch[2];
          console.log('[PDF View] Extracted path from URL:', fullPath);
          
          const pathParts = fullPath.split('/');
          bucketName = pathParts[0];
          objectPath = pathParts.slice(1).join('/');
        } else {
          console.error('[PDF View] Could not extract path from URL using regex');
        }
      }
      // CASE 2: Just a bucket path like 'videos/123.mp4'
      else {
        console.log('[PDF View] Case 2: Simple path format detected');
        // Remove leading and trailing slashes
        const cleanPath = filePath.replace(/^\/+|\/+$/g, '');
        const pathParts = cleanPath.split('/');
        
        // Default to 'reports' bucket if not specified
        if (pathParts.length === 1) {
          bucketName = 'reports'; // Default bucket for reports
          objectPath = pathParts[0];
        } else {
          bucketName = pathParts[0];
          objectPath = pathParts.slice(1).join('/');
        }
      }
      
      console.log('[PDF View] Using bucket:', bucketName);
      console.log('[PDF View] Using object path:', objectPath);
      
      if (!bucketName || !objectPath) {
        throw new Error('Could not determine bucket name or object path');
      }
      
      // Create a fresh signed URL with 60 minute expiration
      console.log('[PDF View] Requesting signed URL from Supabase...');
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(objectPath, 3600); // 3600 seconds = 60 minutes
      
      if (error) {
        console.error('[PDF View] Supabase error:', error);
        throw new Error(`Error generating signed URL: ${error.message}`);
      }
      
      if (!data || !data.signedUrl) {
        throw new Error('Failed to generate signed URL - data is empty');
      }
      
      console.log('[PDF View] Success! Generated signed URL:', data.signedUrl.substring(0, 100) + '...');
      
      // Use an anchor tag to open in new tab for more reliable browser behavior
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Opening PDF document');
    } catch (error) {
      console.error('[PDF View] Error:', error);
      toast.error('PDF unavailable. Please try again later.');
      setIsPdfAvailable(false);
    } finally {
      setIsLoadingFile(false);
    }
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
            {isPdfAvailable ? (
              <button 
                onClick={handleFileView}
                disabled={isLoadingFile}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isLoadingFile ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3`}
              >
                {isLoadingFile ? 'Loading...' : 'View PDF'}
              </button>
            ) : (
              <button 
                disabled
                className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md shadow-sm text-gray-400 bg-gray-100 cursor-not-allowed mr-3"
              >
                PDF Unavailable
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
