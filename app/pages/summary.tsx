import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SummaryCard from '../components/SummaryCard';
import { GeminiAPI, SummaryResult } from '../lib/gemini';

const gemini = new GeminiAPI();

const SummaryPage: React.FC = () => {
  const router = useRouter();
  const { videoUrl } = router.query;
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateSummary() {
      if (!videoUrl || typeof videoUrl !== 'string') return;

      try {
        setIsLoading(true);
        const result = await gemini.generateSummary(videoUrl);
        setSummary(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
      } finally {
        setIsLoading(false);
      }
    }

    generateSummary();
  }, [videoUrl]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Summary</h1>
      
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      ) : summary ? (
        <SummaryCard result={summary} isLoading={isLoading} />
      ) : (
        <SummaryCard
          result={{
            summary: '',
            keywords: [],
            keyPoints: [],
            suggestedTitle: ''
          }}
          isLoading={true}
        />
      )}
    </div>
  );
};

export default SummaryPage;
