'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaFolder, FaFolderOpen } from 'react-icons/fa';
import { FolderGroup, Report } from './utils';
import ReportRow from './ReportRow';

interface FolderSectionProps {
  folderGroup: FolderGroup;
  toggleFolderExpand: (folderId: string) => void;
  onDeleteReport: (id: string) => void;
  onEditReport: (report: Report) => void;
  onViewReport: (report: Report) => void;
  currentPage: number;
  itemsPerPage: number;
}

export default function FolderSection({
  folderGroup,
  toggleFolderExpand,
  onDeleteReport,
  onEditReport,
  onViewReport,
  currentPage,
  itemsPerPage
}: FolderSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate pagination for this folder
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = folderGroup.reports.slice(startIndex, endIndex);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0 }
  };
  
  const contentVariants = {
    hidden: { height: 0, opacity: 0, overflow: 'hidden' },
    visible: { 
      height: 'auto',
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30,
        restDelta: 2
      }
    },
    exit: { 
      height: 0,
      opacity: 0,
      overflow: 'hidden',
      transition: { duration: 0.2 }
    }
  };
  
  // For swipe gestures on mobile
  const handleDragEnd = (e: any, { offset }: any) => {
    setIsDragging(false);
    // Right swipe to expand, left swipe to collapse
    if (offset.x > 50 && !folderGroup.isExpanded) {
      toggleFolderExpand(folderGroup.id);
    } else if (offset.x < -50 && folderGroup.isExpanded) {
      toggleFolderExpand(folderGroup.id);
    }
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-6 border border-gray-200 rounded-lg shadow-sm overflow-hidden"
    >
      {/* Folder Header */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={() => !isDragging && toggleFolderExpand(folderGroup.id)}
        whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
        className="flex items-center justify-between bg-gray-50 p-4 cursor-pointer select-none"
      >
        <div className="flex items-center">
          <motion.div 
            initial={false}
            animate={{ rotate: folderGroup.isExpanded ? 10 : 0, scale: folderGroup.isExpanded ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mr-3 text-amber-500"
          >
            {folderGroup.isExpanded ? <FaFolderOpen size={20} /> : <FaFolder size={20} />}
          </motion.div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{folderGroup.name}</h3>
            <p className="text-sm text-gray-500">{folderGroup.reports.length} reports</p>
          </div>
        </div>
        
        <motion.div 
          animate={{ rotate: folderGroup.isExpanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-gray-500"
        >
          <FaChevronDown />
        </motion.div>
      </motion.div>
      
      {/* Folder Content */}
      <AnimatePresence mode="wait">
        {folderGroup.isExpanded && (
          <motion.div
            key={`folder-content-${folderGroup.id}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible" 
            exit="exit"
            className="bg-white"
          >
            {folderGroup.reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title & Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Summary
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Folder
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {paginatedReports.map((report, index) => (
                        <ReportRow
                          key={report.id}
                          report={report}
                          index={index}
                          onDelete={onDeleteReport}
                          onEdit={onEditReport}
                          onView={onViewReport}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 text-center"
              >
                <p className="text-gray-500">No reports in this folder</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
