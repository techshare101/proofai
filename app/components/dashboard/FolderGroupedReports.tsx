'use client'

import { useState, useEffect } from 'react'
import { Report, Folder } from './ReportCard'
import ReportCard from './ReportCard'
import { HiChevronDown, HiChevronRight, HiOutlineDocumentAdd } from 'react-icons/hi'
import { motion, AnimatePresence, useSpring } from 'framer-motion'

interface FolderGroupedReportsProps {
  reports: Report[]
  onViewReport: (report: Report) => void
  onDeleteReport: (reportId: string) => void
  onMoveReport?: (reportId: string, folderId: string | null) => void
  folders?: Folder[]
}

interface FolderGroup {
  folderName: string
  folderId: string | null
  reports: Report[]
  isExpanded: boolean
}

export default function FolderGroupedReports({ 
  reports, 
  onViewReport, 
  onDeleteReport,
  onMoveReport,
  folders = []
}: FolderGroupedReportsProps) {
  // Group reports by folder
  const [folderGroups, setFolderGroups] = useState<FolderGroup[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Track touch start position for swipe gestures
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null)
  
  // Update folder groups when reports change (e.g., after move)
  useEffect(() => {
    const newGroups = groupReportsByFolder(reports)
    // Preserve expanded state from previous groups
    setFolderGroups(prevGroups => {
      return newGroups.map(newGroup => {
        const prevGroup = prevGroups.find(g => g.folderId === newGroup.folderId)
        return {
          ...newGroup,
          isExpanded: prevGroup?.isExpanded ?? true // Default to expanded for new folders
        }
      })
    })
  }, [reports])
  
  // Set initial load to false after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 300)
    return () => clearTimeout(timer)
  }, [])
  
  // Toggle folder expand/collapse
  const toggleFolderExpand = (folderId: string | null) => {
    setFolderGroups(prevGroups => 
      prevGroups.map(group => 
        group.folderId === folderId 
          ? { ...group, isExpanded: !group.isExpanded } 
          : group
      )
    )
  }
  
  // Handle touch start for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }
  
  // Handle touch end for swipe gestures
  const handleTouchEnd = (e: React.TouchEvent, folderId: string | null) => {
    if (!touchStart) return
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
    
    // Calculate horizontal and vertical distances
    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y
    
    // If horizontal swipe is more significant than vertical and exceeds threshold
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      // Right swipe - expand folder
      if (dx > 0) {
        const group = folderGroups.find(g => g.folderId === folderId)
        if (group && !group.isExpanded) {
          toggleFolderExpand(folderId)
        }
      } 
      // Left swipe - collapse folder
      else {
        const group = folderGroups.find(g => g.folderId === folderId)
        if (group && group.isExpanded) {
          toggleFolderExpand(folderId)
        }
      }
    }
    
    // Reset touch start
    setTouchStart(null)
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {folderGroups.length > 0 ? folderGroups.map((group, groupIndex) => (
        <motion.div 
          key={group.folderId || 'uncategorized'} 
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          initial={isInitialLoad ? { opacity: 0, y: 30 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25, 
            delay: isInitialLoad ? groupIndex * 0.15 : 0 
          }}
          whileHover={{ scale: 1.01, boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e, group.folderId)}
        >
          {/* Folder Header with animated chevron */}
          <motion.div 
            className="flex items-center justify-between bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 min-h-[56px]"
            onClick={() => toggleFolderExpand(group.folderId)}
            role="button"
            aria-expanded={group.isExpanded}
            aria-controls={`folder-content-${group.folderId || 'uncategorized'}`}
            aria-label={`${group.folderName} folder with ${group.reports.length} reports. Click to ${group.isExpanded ? 'collapse' : 'expand'}`}
            whileHover={{ backgroundColor: "rgba(243, 244, 246, 1)" }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                initial={false}
                animate={{ rotate: group.isExpanded ? 90 : 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30 
                }}
              >
                <HiChevronRight className="text-gray-500 w-5 h-5" />
              </motion.div>
              <div className="flex items-center">
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-blue-500 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  animate={{
                    scale: group.isExpanded ? 1.2 : 1,
                    rotate: group.isExpanded ? 5 : 0,
                    color: group.isExpanded ? "#2563eb" : "#3b82f6",
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20 
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </motion.svg>
                <motion.h3 
                  className="font-medium text-gray-800"
                  animate={{ 
                    fontWeight: group.isExpanded ? 600 : 500 
                  }}
                >
                  {group.folderName} <span className="text-gray-500 text-sm font-normal ml-2">({group.reports.length} {group.reports.length === 1 ? 'report' : 'reports'})</span>
                </motion.h3>
              </div>
            </div>
          </motion.div>

          {/* Animated Folder Content - Reports */}
          <AnimatePresence mode="wait">
            {group.isExpanded && (
              <motion.div 
                id={`folder-content-${group.folderId || 'uncategorized'}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
                initial={{ opacity: 0, height: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ 
                  opacity: 1, 
                  height: "auto", 
                  clipPath: "inset(0 0 0% 0)",
                }}
                exit={{ 
                  opacity: 0, 
                  height: 0, 
                  clipPath: "inset(0 0 100% 0)",
                  transition: { duration: 0.2 } 
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  delayChildren: 0.2,
                  staggerChildren: 0.1
                }}
              >
                {group.reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 30 
                    }}
                    whileHover={{ y: -5, scale: 1.03 }}
                  >
                    <ReportCard
                      report={report}
                      onView={onViewReport}
                      onDelete={onDeleteReport}
                      onMove={onMoveReport}
                      folders={folders}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )) : (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <motion.div 
            className="bg-blue-50 rounded-full p-8 mb-6"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.4 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <HiOutlineDocumentAdd className="w-16 h-16 text-blue-500" />
          </motion.div>
          <motion.h3 
            className="text-xl font-semibold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            No folders or reports found
          </motion.h3>
          <motion.p 
            className="text-gray-500 max-w-sm mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Start by creating a new folder or adding a new report
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
              onClick={() => console.log('Create new folder/report')}
            >
              <span className="mr-2">Get Started</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Helper function to group reports by folder
function groupReportsByFolder(reports: Report[]): FolderGroup[] {
  // Create a map to group reports by folder
  const folderMap = new Map<string, Report[]>()
  
  // Group reports by folder_id
  reports.forEach(report => {
    const folderId = report.folder_id || 'uncategorized'
    if (!folderMap.has(folderId)) {
      folderMap.set(folderId, [])
    }
    folderMap.get(folderId)!.push(report)
  })
  
  // Convert map to array of folder groups
  const groups: FolderGroup[] = []
  folderMap.forEach((folderReports, folderId) => {
    // Get the folder name from the first report in the group
    // or default to "Uncategorized" if no folder name
    const folderName = (folderId !== 'uncategorized' && folderReports[0].folder_name) 
      ? folderReports[0].folder_name 
      : "Uncategorized"
      
    groups.push({
      folderId: folderId === 'uncategorized' ? null : folderId,
      folderName,
      reports: folderReports,
      isExpanded: true // Default to expanded
    })
  })
  
  // Sort groups: first by whether they have a folder (uncategorized last)
  // then alphabetically by folder name
  return groups.sort((a, b) => {
    if (a.folderId === null && b.folderId !== null) return 1
    if (a.folderId !== null && b.folderId === null) return -1
    return a.folderName.localeCompare(b.folderName)
  })
}
