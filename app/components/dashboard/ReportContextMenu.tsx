'use client'

import * as ContextMenu from '@radix-ui/react-context-menu'
import { Report } from './ReportCard'

interface ReportContextMenuProps {
  report: Report
  onView: (report: Report) => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  onEditTags?: (id: string) => void
}

export default function ReportContextMenu({ 
  report,
  onView,
  onRename, 
  onDelete,
  onEditTags,
  children 
}: ReportContextMenuProps & { children: React.ReactNode }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      
      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-[180px] bg-white rounded-md p-1 shadow-lg border border-gray-200 z-50 text-sm"
        >
          <ContextMenu.Item 
            className="flex items-center px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded"
            onClick={() => onView(report)}
          >
            <span className="mr-2">👁️</span> View report
          </ContextMenu.Item>
          
          <ContextMenu.Item 
            className="flex items-center px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded"
            onClick={() => {
              const newTitle = prompt('Enter new report title:', report.title)
              if (newTitle && newTitle.trim() !== '' && newTitle !== report.title) {
                onRename(report.id, newTitle.trim())
              }
            }}
          >
            <span className="mr-2">📝</span> Rename report
          </ContextMenu.Item>
          
          {onEditTags && (
            <ContextMenu.Item 
              className="flex items-center px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer rounded"
              onClick={() => onEditTags(report.id)}
            >
              <span className="mr-2">🏷️</span> Edit tags
            </ContextMenu.Item>
          )}
          
          <ContextMenu.Separator className="h-px bg-gray-200 my-1" />
          
          <ContextMenu.Item 
            className="flex items-center px-2 py-1.5 hover:bg-red-50 hover:text-red-600 cursor-pointer rounded text-red-500"
            onClick={() => {
              if (confirm('Are you sure you want to delete this report?')) {
                onDelete(report.id)
              }
            }}
          >
            <span className="mr-2">❌</span> Delete report
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
