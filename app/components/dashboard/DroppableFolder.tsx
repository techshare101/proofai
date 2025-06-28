'use client'

import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'
import FolderContextMenu from './FolderContextMenu'
import supabase from '@/lib/supabase'

interface DroppableFolderProps {
  id: string
  isActive: boolean
  onFolderClick: (folderId: string) => void
  children: ReactNode
  name: string
  userId: string
  onFolderDeleted?: () => void
}

export default function DroppableFolder({ id, isActive, onFolderClick, children, name, userId, onFolderDeleted }: DroppableFolderProps) {
  // Set up droppable for folder
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${id}`,
    data: {
      type: 'folder',
      folderId: id
    }
  });

  const handleRenameFolder = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error renaming folder:', err);
      alert('Failed to rename folder');
    }
  };
  
  const handleDeleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      if (onFolderDeleted) {
        onFolderDeleted();
      } else {
        // Refresh the page to reflect changes
        window.location.reload();
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      alert('Failed to delete folder');
    }
  };

  return (
    <FolderContextMenu
      folderId={id}
      folderName={name}
      onRename={handleRenameFolder}
      onDelete={handleDeleteFolder}
    >
      <button
        ref={setNodeRef}
        onClick={() => onFolderClick(id)}
        className={`flex-grow text-left px-3 py-2 rounded-md text-sm font-medium 
          ${isActive
            ? 'bg-blue-50 text-blue-600' 
            : isOver
              ? 'bg-green-50 text-green-600 border border-green-300'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        {children}
      </button>
    </FolderContextMenu>
  );
}
