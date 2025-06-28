'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaCalendarAlt, FaFolderOpen, FaFileExport } from 'react-icons/fa';
import { Report, exportToCSV } from './utils';

interface FiltersBarProps {
  folderNames: string[];
  reports: Report[];
  onSearch: (query: string) => void;
  onFolderFilter: (folder: string) => void;
  onDateFilter: (date: string) => void;
}

export default function FiltersBar({
  folderNames,
  reports,
  onSearch,
  onFolderFilter,
  onDateFilter
}: FiltersBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };
  
  // Handle folder selection
  const handleFolderSelect = (folder: string) => {
    setSelectedFolder(folder);
    onFolderFilter(folder);
    setDropdownOpen(false);
  };
  
  // Handle date filter
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    onDateFilter(e.target.value);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <motion.input
            type="text"
            placeholder="Search title, location..."
            value={searchQuery}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            whileFocus={{ scale: 1.01, boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </div>
        
        {/* Folder dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex justify-between items-center w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <div className="flex items-center">
              <FaFolderOpen className="mr-2 h-4 w-4 text-gray-400" />
              <span>{selectedFolder || 'All Folders'}</span>
            </div>
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto"
              >
                <div 
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${!selectedFolder ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => handleFolderSelect('')}
                >
                  All Folders
                </div>
                {folderNames.map((folder) => (
                  <div
                    key={folder}
                    className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${selectedFolder === folder ? 'bg-blue-50 text-blue-700' : ''}`}
                    onClick={() => handleFolderSelect(folder)}
                  >
                    {folder}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Date filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaCalendarAlt className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Export button */}
        <motion.button
          onClick={() => exportToCSV(reports)}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={reports.length === 0}
        >
          <FaFileExport className="mr-2 h-4 w-4" />
          Export to CSV
        </motion.button>
      </div>
    </motion.div>
  );
}
