'use client';

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { FileText, FolderPlus, Upload } from 'lucide-react';
import { handleManualUpload, getFoldersForUser } from '@/utils/uploadUtils';

interface ManualUploadProps {
  userId: string;
  onUploadSuccess?: () => void;
  className?: string;
}

export default function ManualUpload({ userId, onUploadSuccess, className = '' }: ManualUploadProps) {
  const [folderName, setFolderName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const { toast } = useToast();

  // Load existing folders when component mounts
  useEffect(() => {
    const loadFolders = async () => {
      if (userId) {
        try {
          const folders = await getFoldersForUser(userId);
          setExistingFolders(folders as string[]);
        } catch (error) {
          console.error('Error loading folders:', error);
        }
      }
    };
    loadFolders();
  }, [userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type if needed
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: 'File too large',
          description: 'Maximum file size is 50MB',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        type: 'error',
      });
      return;
    }

    const targetFolder = showFolderInput ? folderName : selectedFolder;
    if (!targetFolder) {
      toast({
        title: 'No folder selected',
        description: 'Please select or create a folder',
        type: 'error',
      });
      return;
    }

    try {
      setIsUploading(true);
      await handleManualUpload(file, targetFolder, userId);
      
      toast({
        title: 'Upload successful',
        description: `${file.name} has been uploaded to ${targetFolder}`,
        type: 'success',
      });
      
      // Reset form
      setFile(null);
      setFolderName('');
      setSelectedFolder('');
      
      // Refresh folders list
      const folders = await getFoldersForUser(userId);
      setExistingFolders(folders);
      
      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5" />
        Upload New File
      </h2>
      
      {/* File input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File
        </label>
        <div className="mt-1 flex items-center">
          <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {file ? file.name : 'Select file'}
            <input
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.avi,.wav,.mp3"
            />
          </label>
          {file && (
            <span className="ml-2 text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>
      </div>

      {/* Folder selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Folder
        </label>
        
        {existingFolders.length > 0 && !showFolderInput && (
          <div className="space-y-2">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a folder</option>
              {existingFolders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => setShowFolderInput(true)}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 w-full"
              >
                <FolderPlus className="h-4 w-4" />
                Create new folder
              </button>
            </div>
          </div>
        )}

        {(showFolderInput || existingFolders.length === 0) && (
          <div className="space-y-2">
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {existingFolders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFolderInput(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to folder selection
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={isUploading || !file || (!folderName && !selectedFolder)}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          'Upload File'
        )}
      </button>
    </div>
  );
}
