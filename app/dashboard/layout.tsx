'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Header from '../components/dashboard/Header'
import FolderSidebar from '../components/dashboard/FolderSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
    }
  }, [session])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <FolderSidebar userId={user?.id} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
