'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaPencilAlt, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDate, formatRelativeTime, Report, supabase } from './utils';

interface ReportRowProps {
  report: Report;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (report: Report) => void;
  onView: (report: Report) => void;
}

export default function ReportRow({
  report,
  index,
  onDelete,
  onEdit,
  onView
}: ReportRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Staggered animation for row appearance
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    deleting: { 
      opacity: 0.5,
      filter: "grayscale(100%)",
      transition: { duration: 0.3 }
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${report.title}"?`)) {
      try {
        console.log(`[DeleteStrike] ReportRow initiating delete for report: ${report.id}`);
        setIsDeleting(true);
        
        // Call the parent's delete handler which handles the Supabase deletion
        // Note: We're keeping the row in "deleting" visual state permanently
        // The parent component should handle removing it from the list
        await onDelete(report.id);
        
        // We don't reset isDeleting because the row should disappear from UI
        // If it's still visible, it should remain in deleting state
      } catch (error) {
        console.error('[DeleteStrike] Error in ReportRow delete handler:', error);
        toast.error('Failed to delete report');
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.tr
      className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${isDeleting ? 'pointer-events-none' : ''}`}
      custom={index}
      initial="hidden"
      animate={isDeleting ? "deleting" : "visible"}
      exit="exit"
      variants={rowVariants}
      layout
      layoutId={report.id}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-800">{report.title}</div>
        <div className="text-sm text-gray-500">{report.location}</div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-700 line-clamp-2">
          {report.summary}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {report.folder_name || 'Uncategorized'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-700">{formatDate(report.created_at)}</div>
        <div className="text-xs text-gray-500">{formatRelativeTime(report.created_at)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => onView(report)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            aria-label="View report"
          >
            <FaEye />
          </button>
          <button
            onClick={() => onEdit(report)}
            className="text-green-600 hover:text-green-900 transition-colors"
            aria-label="Edit report"
          >
            <FaPencilAlt />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`text-red-600 hover:text-red-900 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Delete report"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
