'use client'

import { useEffect, useState } from 'react'
import supabase from '../../lib/supabaseClient'

interface Folder {
  id: string
  name: string
}

interface FolderSidebarProps {
  userId: string | undefined
}

export default function FolderSidebar({ userId }: FolderSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

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
    <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
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
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium 
                ${activeFolder === folder.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {folder.name}
            </button>
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
