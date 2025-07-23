'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteFolder } from '@/supabase/deleteFolder'
import DroppableFolder from './DroppableFolder'
import toast from 'react-hot-toast'

interface Folder {
  id: string
  name: string
}

interface FolderSidebarProps {
  userId: string | undefined
  onReportDrop?: (reportId: string, folderId: string) => Promise<void>
  className?: string
}

export default function FolderSidebar({ userId, onReportDrop, className = '' }: FolderSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Track deleted folder IDs using localStorage
  const getDeletedFolderIds = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deletedFolderIds')
      return saved ? JSON.parse(saved) : []
    }
    return []
  }
  
  const addDeletedFolderId = (id: string) => {
    if (typeof window !== 'undefined') {
      const deletedIds = getDeletedFolderIds()
      if (!deletedIds.includes(id)) {
        deletedIds.push(id)
        localStorage.setItem('deletedFolderIds', JSON.stringify(deletedIds))
      }
    }
  }

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
      
      // Filter out any folders that we've marked as deleted in localStorage
      const deletedIds = getDeletedFolderIds()
      const filteredData = (data || []).filter(folder => !deletedIds.includes(folder.id))
      
      console.log(`Fetched ${data?.length || 0} folders, filtered out ${(data?.length || 0) - filteredData.length} deleted folders`)
      setFolders(filteredData)
      
      // Set the first folder as active by default
      if (filteredData.length > 0 && !activeFolder) {
        setActiveFolder(filteredData[0].id)
      } else if (filteredData.length === 0) {
        // No folders left, clear the active folder
        setActiveFolder(null)
        window.dispatchEvent(new CustomEvent('folderChange', { detail: { folderId: null } }))
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Folders</h2>
        <button 
          onClick={() => fetchFolders()} 
          className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
          title="Refresh folder list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this folder?')) {
                    toast.loading('Deleting folder...', { id: 'deleteFolder' });
                    deleteFolder(folder.id, userId).then((result) => {
                      if (result.success) {
                        toast.success('Folder deleted successfully!', { id: 'deleteFolder' });
                        // Re-fetch the folders list
                        fetchFolders();
                        // If the active folder was deleted, reset to null
                        if (activeFolder === folder.id) {
                          setActiveFolder(null);
                          // Dispatch event with null folderId
                          window.dispatchEvent(new CustomEvent('folderChange', { detail: { folderId: null } }));
                        }
                      } else {
                        // If we get an error saying the folder doesn't exist, remove it from the UI
                        if (result.error && typeof result.error === 'string' && 
                            (result.error.includes('not found') || result.error.includes('No rows'))) {
                          console.log(`Removing non-existent folder ${folder.id} from UI`);
                          
                          // Add to localStorage deleted folders list to prevent it from showing up again
                          addDeletedFolderId(folder.id);
                          
                          // Remove the folder from our local state since it doesn't exist in the DB
                          setFolders(currentFolders => 
                            currentFolders.filter(f => f.id !== folder.id)
                          );
                          toast.success('Folder removed from UI', { id: 'deleteFolder' });
                        } else {
                          toast.error(`Failed to delete folder: ${result.error}`, { id: 'deleteFolder' });
                          setError(`Failed to delete folder: ${result.error}`);
                        }
                      }
                    }).catch(err => {
                      console.error('Error deleting folder:', err);
                      toast.error('Failed to delete folder', { id: 'deleteFolder' });
                      setError('Failed to delete folder');
                    });
                  }
                }}
                className="text-red-500 text-sm ml-4 p-1 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </nav>
      
      {/* New folder input */}
      <div>
        {isCreating ? (
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
