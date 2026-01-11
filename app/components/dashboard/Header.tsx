'use client'

import { User } from '@supabase/supabase-js'
import supabase from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUserPlan } from '../../hooks/useUserPlan'

interface HeaderProps {
  user: User | null
}

export default function Header({ user }: HeaderProps) {
  const { plan } = useUserPlan()
  const planType = plan.plan // Extract plan type string from UserPlan object
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/login')
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
            {/* Mission Partner Badge */}
            {planType === 'mission_partner' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                🌍 Mission Partner
              </span>
            )}
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
