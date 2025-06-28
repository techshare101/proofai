'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import Header from '../components/dashboard/Header'
import FolderSidebar from '../components/dashboard/FolderSidebar'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when resizing to large screens to prevent both sidebar versions showing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
    }
  }, [session])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed z-20 top-16 left-4 bg-white p-3 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <HiOutlineX className="h-6 w-6 text-gray-600" />
          ) : (
            <HiOutlineMenu className="h-6 w-6 text-gray-600" />
          )}
        </button>
        
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-10 md:hidden" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar (toggle visibility with state) */}
        <div className="block md:hidden">
          <div 
            className={`
              fixed inset-y-0 left-0 z-20 transform 
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              transition-transform duration-300 ease-in-out
            `}
          >
            <FolderSidebar userId={user?.id} className="h-full" />
          </div>
        </div>

        {/* Desktop Sidebar (always visible on md+) */}
        <div className="hidden md:block">
          <FolderSidebar userId={user?.id} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
