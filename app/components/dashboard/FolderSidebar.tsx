'use client'
import { useState, useEffect, useMemo } from 'react'
import supabase from '@/lib/supabase'
import { deleteFolder } from '../../../supabase/deleteFolder'
import DroppableFolder from './DroppableFolder'
import Link from 'next/link'

interface Folder {
  id: string
  name: string
}

interface FolderSidebarProps {
  userId: string | undefined
  onReportDrop?: (reportId: string, folderId: string) => Promise<void>
  className?: string
  canUseFolders?: boolean
}

export default function FolderSidebar({ userId, onReportDrop, className = '', canUseFolders = true }: FolderSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchFolders()
    }
  }, [userId])

  const fetchFolders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      
      setFolders(data || [])
      
      // Set the first folder as active by default
      if (data && data.length > 0 && !activeFolder) {
        setActiveFolder(data[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching folders:', err)
      setError('Failed to load folders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return
    
    try {
      setIsCreating(true)
      
      const { data, error } = await supabase
        .from('folders')
        .insert([
          { user_id: userId, name: newFolderName.trim() }
        ])
        .select('id, name')
        .single()
      
      if (error) throw error
      
      // Add the new folder to the list
      setFolders([...folders, data])
      setNewFolderName('')
      setIsCreating(false)
      
    } catch (err: any) {
      console.error('Error creating folder:', err)
      setError('Failed to create folder')
      setIsCreating(false)
    }
  }

  const handleFolderClick = (folderId: string) => {
    setActiveFolder(folderId)
    // This will be used for filtering reports in the main component
    window.dispatchEvent(new CustomEvent('folderChange', { detail: { folderId } }))
  }

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Folders</h2>
      </div>
      
      {/* Folder list */}
      <nav className="space-y-1 mb-6">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading folders...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : folders.length === 0 ? (
          <div className="text-sm text-gray-500">No folders found</div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="flex justify-between items-center">
              <DroppableFolder 
                id={folder.id} 
                isActive={activeFolder === folder.id}
                onFolderClick={handleFolderClick}
                name={folder.name}
                userId={userId}
                onFolderDeleted={fetchFolders}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {folder.name}
                </div>
              </DroppableFolder>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Delete this folder? Reports will be moved to All Reports.')) {
                    setDeletingFolderId(folder.id);
                    try {
                      await deleteFolder(folder.id, userId);
                      // Re-fetch the folders list
                      await fetchFolders();
                      // If the active folder was deleted, reset to null
                      if (activeFolder === folder.id) {
                        setActiveFolder(null);
                        // Dispatch event with null folderId
                        window.dispatchEvent(new CustomEvent('folderChange', { detail: { folderId: null } }));
                      }
                    } catch (err) {
                      console.error('Error deleting folder:', err);
                      setError('Failed to delete folder');
                    } finally {
                      setDeletingFolderId(null);
                    }
                  }
                }}
                disabled={deletingFolderId === folder.id}
                className={`text-sm ml-4 p-1 rounded ${
                  deletingFolderId === folder.id 
                    ? 'text-gray-400 cursor-wait' 
                    : 'text-red-500 hover:bg-red-50'
                }`}
              >
                {deletingFolderId === folder.id ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Delete'}
              </button>
            </div>
          ))
        )}
      </nav>
      
      {/* New folder input */}
      <div>
        {!canUseFolders ? (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Folders require Community plan or higher</p>
            <Link 
              href="/pricing"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Upgrade to unlock
            </Link>
          </div>
        ) : isCreating ? (
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewFolderName('')
                }}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Folder
          </button>
        )}
      </div>
    </aside>
  )
}
