'use client'

import DashboardView from '../components/DashboardView'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Reports</h1>
        <p className="text-gray-600">Manage and view your PDF reports</p>
      </div>
      
      <DashboardView />
    </div>
  )
}
