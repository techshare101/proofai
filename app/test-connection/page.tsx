'use client';

import { useEffect, useState } from 'react';

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function testConnection() {
      try {
        const response = await fetch('/api/test-connection');
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
          setMessage(`${data.message} - Found ${data.count} recordings`);
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Failed to test connection');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        
        {status === 'loading' && (
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <p>Testing connection...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-700">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
