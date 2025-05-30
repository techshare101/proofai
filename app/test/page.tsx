'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LegalSummaryGenerator from '../components/LegalSummaryGenerator';

export default function TestPage() {
  const [error, setError] = useState<string>();

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('recordings').select('count').single();
        if (error) throw error;
        console.log('✅ Supabase connection successful');
      } catch (err) {
        console.error('❌ Supabase connection error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to Supabase');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Legal Summary Generator Test</h1>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Configuration Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <LegalSummaryGenerator
          caseId="TEST-001"
          userName="Test User"
        />
      )}
    </div>
  );
}
