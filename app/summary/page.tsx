'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic"; // Prevents static build

const SummaryPage = () => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setSupabase(client);
  }, []);

  const fetchSummary = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      setSummary(data?.content || 'No summary found.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Latest Summary</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <pre className="bg-gray-100 p-4 rounded">{summary}</pre>
      )}
    </div>
  );
};

export default SummaryPage;
