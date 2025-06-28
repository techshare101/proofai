'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPencilAlt, FaTimes, FaSave } from 'react-icons/fa';
import { Report, supabase } from './utils';
import toast from 'react-hot-toast';

interface ReportEditModalProps {
  report: Report;
  onClose: () => void;
  onSave: (updatedReport: Report) => void;
}

export default function ReportEditModal({ report, onClose, onSave }: ReportEditModalProps) {
  const [formState, setFormState] = useState<Partial<Report>>({
    title: report.title,
    summary: report.summary,
    location: report.location,
    original_transcript: report.original_transcript,
    translated_transcript: report.translated_transcript,
  });
  const [folderOptions, setFolderOptions] = useState<Array<{id: string, name: string}>>([]);
  const [saving, setSaving] = useState(false);
  
  // Fetch available folders
  useEffect(() => {
    async function fetchFolders() {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name');
        
      if (!error && data) {
        setFolderOptions(data);
      }
    }
    
    fetchFolders();
  }, []);
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Update the report in Supabase
      const { data, error } = await supabase
        .from('reports')
        .update({
          title: formState.title,
          summary: formState.summary,
          location: formState.location,
          original_transcript: formState.original_transcript,
          translated_transcript: formState.translated_transcript,
          folder_id: formState.folder_id || report.folder_id
        })
        .eq('id', report.id)
        .select();
      
      if (error) throw error;
      
      // Get updated folder name
      const folderId = formState.folder_id || report.folder_id;
      let folderName = report.folder_name;
      
      if (folderId && folderId !== report.folder_id) {
        const selectedFolder = folderOptions.find(folder => folder.id === folderId);
        if (selectedFolder) {
          folderName = selectedFolder.name;
        }
      }
      
      // Create updated report object with all properties
      const updatedReport = {
        ...report,
        ...formState,
        folder_name: folderName
      };
      
      onSave(updatedReport);
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setSaving(false);
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
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <FaPencilAlt className="text-green-600 h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Edit Report</h3>
            </div>
            <button 
              onClick={onClose}
              className="bg-white rounded-md p-2 hover:bg-gray-100 focus:outline-none"
            >
              <FaTimes className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formState.title}
                    onChange={handleChange}
                    required
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formState.location || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Folder */}
                <div>
                  <label htmlFor="folder_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Folder
                  </label>
                  <select
                    name="folder_id"
                    id="folder_id"
                    value={formState.folder_id || report.folder_id || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Uncategorized</option>
                    {folderOptions.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Summary */}
                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    id="summary"
                    rows={3}
                    value={formState.summary || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Transcripts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="original_transcript" className="block text-sm font-medium text-gray-700 mb-1">
                      Original Transcript
                    </label>
                    <textarea
                      name="original_transcript"
                      id="original_transcript"
                      rows={5}
                      value={formState.original_transcript || ''}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="translated_transcript" className="block text-sm font-medium text-gray-700 mb-1">
                      Translated Transcript
                    </label>
                    <textarea
                      name="translated_transcript"
                      id="translated_transcript"
                      rows={5}
                      value={formState.translated_transcript || ''}
                      onChange={handleChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2 -ml-1 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
