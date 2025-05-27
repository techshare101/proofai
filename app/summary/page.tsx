'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateVideoSummary } from '../lib/gemini';
import type { SummaryResult } from '../types';
import SummaryCard from '../components/SummaryCard';
import { supabase } from '../lib/supabase';
import { generateSummaryPDF } from '../lib/pdf';

export default function SummaryPage() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');

  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      if (!videoUrl) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setSummary(null);

      console.log('🔍 Analyzing video:', videoUrl);
      
      try {
        const result = await generateVideoSummary(videoUrl);
        
        if (!result) {
          throw new Error('Failed to generate summary');
        }
        
        setSummary(result);
        console.log('✅ Summary generated successfully');

        // Save summary and report relevance back to Supabase
        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            summary: result.summary,
            legal_relevance: result.reportRelevance?.legal || false,
            hr_relevance: result.reportRelevance?.hr || false,
            safety_relevance: result.reportRelevance?.safety || false,
            relevance_explanation: result.reportRelevance?.explanation || '',
            updated_at: new Date().toISOString()
          })
          .eq('file_url', videoUrl);

        if (updateError) {
          console.error('⚠️ Failed to save summary to Supabase:', updateError);
        } else {
          console.log('✅ Summary saved to Supabase');
        }
      } catch (err: any) {
        console.error('❌ Summary generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [videoUrl]);

  if (!videoUrl) return <div className="p-8 text-red-600">Missing video URL</div>;
  if (loading) return <div className="p-8 text-gray-600 animate-pulse">Summarizing...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!summary) return <div className="p-8">No summary generated.</div>;

  return (
    <div className="p-4">
      {summary && (
        <>
          <SummaryCard result={summary} isLoading={false} />
          <button
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            onClick={() => generateSummaryPDF(summary)}
          >
            📄 Download Legal Report (PDF)
          </button>
        </>
      )}
    </div>
  );
}
