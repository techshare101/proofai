'use client'

import { useEffect, useState } from 'react'
import supabase from '../../lib/supabase'

// This is a temporary debugging component to expose state values
export default function StateDebugger() {
  const [stateData, setStateData] = useState<any>({
    reports: [],
    folders: [],
    recentQueries: [],
    loading: false,
    activeFolder: null,
    cardView: true
  })
  
  useEffect(() => {
    // Listen to custom debug events from the main components
    const handleDebugEvent = (e: CustomEvent) => {
      setStateData(prevData => ({
        ...prevData,
        ...e.detail
      }))
    }
    
    // Create listener for debug events
    window.addEventListener('dashboardDebug' as any, handleDebugEvent as EventListener)
    
    // Log initial database requests
    const originalFrom = supabase.from
    
    supabase.from = function(table: string) {
      console.log(`[DEBUG] Supabase query on table: ${table}`)
      const result = originalFrom.apply(this, [table])
      
      // Intercept the select method to log queries
      const originalSelect = result.select
      result.select = function(...args: any[]) {
        console.log(`[DEBUG] Supabase select on ${table}:`, ...args)
        // Create query log
        const timestamp = new Date().toISOString()
        const queryDetails = { table, type: 'select', timestamp, args }
        
        // Update debug state with this query
        const currentState = window.dashboardDebugState || { 
          reports: [],
          folders: [],
          recentQueries: [],
          loading: false
        }
        
        window.dashboardDebugState = {
          ...currentState,
          recentQueries: [...(currentState.recentQueries || []), queryDetails].slice(-5)
        }
        
        window.dispatchEvent(
          new CustomEvent('dashboardDebug', { 
            detail: { recentQueries: window.dashboardDebugState.recentQueries }
          })
        )
        
        return originalSelect.apply(this, args)
      }
      
      return result
    }
    
    // Expose original function when component is unmounted
    return () => {
      window.removeEventListener('dashboardDebug' as any, handleDebugEvent as EventListener)
      supabase.from = originalFrom
    }
  }, [])
  
  // Style similar to the dashboard UI
  return (
    <div className="fixed bottom-4 left-4 w-96 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 overflow-auto max-h-96">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Dashboard State Debug</h2>
      
      <div className="space-y-3 text-sm">
        <div>
          <h3 className="font-medium text-blue-600">Reports ({stateData.reports?.length || 0})</h3>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(stateData.reports, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium text-blue-600">Folders ({stateData.folders?.length || 0})</h3>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(stateData.folders, null, 2)}
          </pre>
        </div>
        
        <div className="flex space-x-4">
          <div>
            <h3 className="font-medium text-blue-600">Selected Folder</h3>
            <div className="bg-gray-50 p-2 rounded">
              {stateData.activeFolder || 'None'}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-600">Card View</h3>
            <div className="bg-gray-50 p-2 rounded">
              {stateData.cardView ? 'True' : 'False'}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-600">Loading</h3>
            <div className="bg-gray-50 p-2 rounded">
              {stateData.loading ? 'True' : 'False'}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-blue-600">Recent Queries</h3>
          <div className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-32">
            {stateData.recentQueries?.map((query: any, i: number) => (
              <div key={i} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                <div>{query.table} ({query.type}) - {new Date(query.timestamp).toLocaleTimeString()}</div>
                <div className="text-gray-500">{JSON.stringify(query.args)}</div>
              </div>
            )) || 'No queries tracked yet'}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-blue-600">Component Props</h3>
          <div className="space-y-1">
            <details>
              <summary className="cursor-pointer">ReportCard Props</summary>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-20">
                {JSON.stringify(stateData.reportCardProps, null, 2) || 'Not captured yet'}
              </pre>
            </details>
            <details>
              <summary className="cursor-pointer">PDFViewerModal Props</summary>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-20">
                {JSON.stringify(stateData.pdfViewerProps, null, 2) || 'Not captured yet'}
              </pre>
            </details>
            <details>
              <summary className="cursor-pointer">EmptyState Props</summary>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-20">
                {JSON.stringify(stateData.emptyStateProps, null, 2) || 'Not captured yet'}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add TypeScript interface for global window
declare global {
  interface Window {
    dashboardDebugState: any;
  }
}
