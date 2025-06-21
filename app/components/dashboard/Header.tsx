'use client'

import { User } from '@supabase/supabase-js'
import supabase from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface HeaderProps {
  user: User | null
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl font-bold text-blue-600">ProofAI Dashboard</h1>
          </div>

          {/* User info and logout */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-sm text-gray-700">
                {user.email}
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
