'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReportDashboardPro from '../components/ReportDashboardPro';
import { insertSampleReports } from '../utils/insertSampleReports';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function ReportDashboardProPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataAdded, setDataAdded] = useState(false);

  // Function to seed sample data for demonstration
  const handleAddSampleData = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to add sample data');
      return;
    }

    try {
      setLoading(true);
      const createdReports = await insertSampleReports(session.user.id);
      
      if (createdReports.length > 0) {
        toast.success(`Added ${createdReports.length} sample reports`);
        setDataAdded(true);
      } else {
        toast.error('Failed to add sample data');
      }
    } catch (error) {
      console.error('Error adding sample data:', error);
      toast.error('An error occurred while adding sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Report Dashboard Pro</h1>
              <p className="mt-1 text-gray-600">Advanced report management with animated UI</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Standard Dashboard
              </Link>
              
              <motion.button
                onClick={handleAddSampleData}
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Data...
                  </>
                ) : (
                  'Add Sample Data'
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!session ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You need to be logged in to use the Reports Dashboard.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <ReportDashboardPro userId={session.user.id} />
          )}
        </div>
      </main>
    </div>
  );
}
