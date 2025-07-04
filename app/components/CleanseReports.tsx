'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CleanseReports() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setStatus('🔍 Fetching files from Supabase...');
    setDetails([]);

    const { data, error } = await supabase
      .storage
      .from('recordings')
      .list('reports');

    if (error) {
      setStatus(`❌ Failed to list files: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setStatus('✅ No files found to delete.');
      setLoading(false);
      return;
    }

    // Log details about files to delete
    const fileDetails = data.map(file => {
      const size = file.metadata?.size || 0;
      return `${file.name} (${Math.round(size/1024)} KB)`;
    });
    setDetails(fileDetails);
    
    const pathsToDelete = data.map(file => `reports/${file.name}`);

    setStatus(`🔍 Found ${pathsToDelete.length} files to delete. Processing...`);

    const { error: deleteError } = await supabase
      .storage
      .from('recordings')
      .remove(pathsToDelete);

    if (deleteError) {
      setStatus(`❌ Failed to delete: ${deleteError.message}`);
    } else {
      setStatus(`✅ Deleted ${pathsToDelete.length} PDF(s) from /reports`);
    }

    setLoading(false);
  };

  // Optional: add ability to only delete small files
  const handleDeleteSmall = async () => {
    setLoading(true);
    setStatus('🔍 Fetching files from Supabase...');
    setDetails([]);

    const { data, error } = await supabase
      .storage
      .from('recordings')
      .list('reports');

    if (error) {
      setStatus(`❌ Failed to list files: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setStatus('✅ No files found to delete.');
      setLoading(false);
      return;
    }

    // Filter to only small files (<5KB)
    const smallFiles = data.filter(file => {
      const size = file.metadata?.size || 0;
      return size < 5000;
    });

    if (smallFiles.length === 0) {
      setStatus('✅ No small files found to delete.');
      setLoading(false);
      return;
    }

    // Log details about files to delete
    const fileDetails = smallFiles.map(file => {
      const size = file.metadata?.size || 0;
      return `${file.name} (${Math.round(size/1024)} KB)`;
    });
    setDetails(fileDetails);
    
    const pathsToDelete = smallFiles.map(file => `reports/${file.name}`);

    setStatus(`🔍 Found ${pathsToDelete.length} small files to delete. Processing...`);

    const { error: deleteError } = await supabase
      .storage
      .from('recordings')
      .remove(pathsToDelete);

    if (deleteError) {
      setStatus(`❌ Failed to delete: ${deleteError.message}`);
    } else {
      setStatus(`✅ Deleted ${pathsToDelete.length} small PDF(s) from /reports`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white border border-red-300 rounded p-4 space-y-4 shadow-sm">
      <h3 className="text-lg font-bold text-red-600">Danger Zone: Purge Reports</h3>
      <p className="text-sm text-gray-600">
        This will permanently delete files from <code>/recordings/reports</code> in Supabase.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {loading ? 'Deleting...' : '🗑️ Delete All Reports'}
        </button>
        
        <button
          onClick={handleDeleteSmall}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
        >
          {loading ? 'Deleting...' : '🔍 Delete Small Files Only (<5KB)'}
        </button>
      </div>
      
      {status && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium">{status}</p>
          
          {details.length > 0 && (
            <div className="mt-2">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              
              {showDetails && (
                <div className="mt-2 max-h-40 overflow-y-auto text-xs bg-gray-100 p-2 rounded">
                  <ul className="list-disc pl-4">
                    {details.map((detail, i) => (
                      <li key={i} className="mb-1">{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
