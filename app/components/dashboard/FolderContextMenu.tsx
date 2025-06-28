'use client'

import * as ContextMenu from '@radix-ui/react-context-menu'
import { useEffect, useState } from 'react'

interface FolderContextMenuProps {
  folderId: string
  folderName: string
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
}

export default function FolderContextMenu({ 
  folderId, 
  folderName, 
  onRename, 
  onDelete,
  children 
}: FolderContextMenuProps & { children: React.ReactNode }) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(folderName)

  // Reset newName when folderName changes
  useEffect(() => {
    setNewName(folderName)
  }, [folderName])

  const handleRename = () => {
    if (newName.trim() && newName !== folderName) {
      onRename(folderId, newName.trim())
    }
    setIsRenaming(false)
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      
      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-[180px] bg-white rounded-md p-1 shadow-lg border border-gray-200 z-50 text-sm"
        >
          {isRenaming ? (
            <div className="p-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full p-1 border border-gray-300 rounded mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') setIsRenaming(false)
                }}
              />
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setIsRenaming(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleRename}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <ContextMenu.Item 
                className="flex items-center px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded"
                onClick={() => setIsRenaming(true)}
              >
                <span className="mr-2">📝</span> Rename folder
              </ContextMenu.Item>
              
              <ContextMenu.Separator className="h-px bg-gray-200 my-1" />
              
              <ContextMenu.Item 
                className="flex items-center px-2 py-1.5 hover:bg-red-50 hover:text-red-600 cursor-pointer rounded text-red-500"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this folder?')) {
                    onDelete(folderId)
                  }
                }}
              >
                <span className="mr-2">❌</span> Delete folder
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
