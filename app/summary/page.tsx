'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateVideoSummary } from '../lib/summaryClient';
import type { SummaryResult } from '../types';
import SummaryCard from '../components/SummaryCard';
import { getAnonSupabaseClient } from '../lib/supabase';
import { generateSummaryPDF } from '../lib/pdf';

export const dynamic = 'force-dynamic';

export default function SummaryPage() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('videoUrl');

  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<string>('Brooklyn, NY');

  useEffect(() => {
    // Server-side environment checks are now handled in API routes instead of client components
    
    const OPENCAGE_API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
    console.log('🔑 OpenCage API Key exists:', !!OPENCAGE_API_KEY);

    const getLocationFromIP = async () => {
      try {
        console.log('📍 Falling back to IP-based location...');
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.city && data.region) {
          const location = `${data.city}, ${data.region}, ${data.country_name}`;
          console.log('📍 IP location resolved:', location);
          setUserLocation(location);
          return true;
        }
      } catch (err) {
        console.error('❌ IP location error:', err);
      }
      return false;
    };

    const getLocation = async () => {
      if (!OPENCAGE_API_KEY) {
        console.error('❌ OpenCage API key not found in environment');
        await getLocationFromIP();
        return;
      }

      if (!('geolocation' in navigator)) {
        console.log('🌍 Geolocation not supported');
        await getLocationFromIP();
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        console.log('📍 Got coordinates:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });

        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=${OPENCAGE_API_KEY}`
        );

        if (!response.ok) {
          throw new Error(`OpenCage API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.results?.length) {
          console.error('❌ No results from OpenCage:', data);
          await getLocationFromIP();
          return;
        }

        const location = data.results[0].formatted;
        console.log('📍 Location resolved:', location);
        setUserLocation(location);
      } catch (err) {
        console.error('❌ Error getting location:', err);
        if (err instanceof GeolocationPositionError) {
          switch(err.code) {
            case err.PERMISSION_DENIED:
              console.log('🚫 Location permission denied, trying IP fallback...');
              break;
            case err.POSITION_UNAVAILABLE:
              console.log('❌ Location unavailable, trying IP fallback...');
              break;
            case err.TIMEOUT:
              console.log('⏰ Location timed out, trying IP fallback...');
              break;
          }
        }
        await getLocationFromIP();
      }
    };

    getLocation();
  }, []);

  const fetchSummary = async () => {
      // Only fetch if we don't already have a summary and have a video URL
      if (!videoUrl) {
        setLoading(false);
        return;
      }

      // Prevent fetching if we already have a summary for this video
      if (summary?.summary) {
        console.log('✅ Summary already exists:', summary.summary.substring(0, 100) + '...');
        return;
      }

      setLoading(true);
      setError('');

      console.log('🔍 Analyzing video:', videoUrl);
      
      try {
        const result = await generateVideoSummary(videoUrl);
        
        if (!result) {
          throw new Error('Failed to generate summary');
        }

        // Validate result before setting state
        if (result.summary?.trim()) {
          console.log('✅ New summary generated:', result.summary.substring(0, 100) + '...');
          // Ensure transcript is included in summary state
          setSummary({
            ...result,
            transcript: result.transcript || result.notableQuotes?.join('\n\n')
          });
        } else {
          console.error('❌ Generated summary is empty or invalid:', result);
          throw new Error('Generated summary is empty or invalid');
        }

        // Prepare update payload - only include fields we know exist
        const updatePayload = {
          summary: result.summary,
          legal_relevance: result.reportRelevance?.legal || false,
          hr_relevance: result.reportRelevance?.hr || false
        };

        console.log('🧾 PATCH Payload:', updatePayload);

        // Encode the file URL for the filter
        const encodedFileUrl = encodeURIComponent(videoUrl);

        // Save summary and report relevance back to Supabase
        const supabase = getAnonSupabaseClient();
        const { data: updateData, error: updateError } = await supabase
          .from('recordings')
          .update(updatePayload)
          .eq('file_url', videoUrl)
          .select();

        if (updateError) {
          console.error('⚠️ Failed to save summary to Supabase:', updateError);
          // Check if it's a schema error
          if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
            console.error('❌ Schema error detected. Please run these SQL commands in Supabase:');
            console.error(`
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS relevance_explanation text;
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS safety_relevance boolean;
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
`);
          }
        } else {
          console.log('📬 PATCH Response:', updateData);
          console.log('✅ Summary saved to Supabase');
        }
      } catch (err: any) {
        console.error('❌ Summary generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchSummary();
  }, [videoUrl, summary, fetchSummary]); // Add fetchSummary to deps

  if (!videoUrl) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">No Video Selected</h1>
        <p className="text-gray-600">Please record or select a video to generate a summary.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Generating summary with OpenAI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl w-full">
          <h2 className="text-red-800 text-lg font-semibold mb-2">⚠️ Error Generating Summary</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4 space-y-2">
            <p className="text-red-700 text-sm">This might happen if:</p>
            <ul className="list-disc list-inside text-red-600 text-sm">
              <li>The video is not accessible</li>
              <li>The video format is not supported</li>
              <li>The video content is unclear or too complex</li>
              <li>There are temporary API issues</li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <button 
                onClick={() => {
                  setError('');
                  setLoading(true);
                  fetchSummary();
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <a 
                href="/"
                className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                Record New Video
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl w-full">
          <h2 className="text-yellow-800 text-lg font-semibold mb-2">⚠️ No Summary Available</h2>
          <p className="text-yellow-600">We couldn't generate a summary for this video. This might happen if:</p>
          <ul className="list-disc list-inside mt-2 text-yellow-600">
            <li>The video is still processing</li>
            <li>The video format is not supported</li>
            <li>There was an error analyzing the content</li>
          </ul>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <SummaryCard result={summary} isLoading={false} />
      <div className="mt-6 space-x-4">
        <button
          onClick={async () => {
            if (!summary) return;

            // Get transcript from various sources in order of preference
            const transcriptContent = summary.transcript || // From Whisper
                                     summary.notableQuotes?.join('\n\n') || // From notable quotes
                                     "Transcript is still processing or unavailable.";

            // Log transcript source for debugging
            console.log('📝 Transcript source:', {
              fromWhisper: !!summary.transcript,
              fromNotableQuotes: !summary.transcript && !!summary.notableQuotes,
              transcriptLength: transcriptContent.length,
              previewContent: transcriptContent.substring(0, 100) + '...'
            });

            // Create a summary object with the correct structure for the PDF API
            const caseId = `CASE-${Date.now()}`;
            const updatedSummary = {
              ...summary,
              caseId: caseId,
              reportDate: new Date().toISOString(),
              location: userLocation || 'Unknown',  // Use geocoded location
            };
            
            console.log('📍 Location being sent to PDF API:', updatedSummary.location);
            
            // Format the summary text for the PDF
            const formattedSummary = `PROOF AI INCIDENT REPORT\n\n` +
              `Case ID: ${caseId}\n` +
              `Report Date: ${new Date().toLocaleString()}\n` +
              `Location: ${updatedSummary.location}\n` +
              `Reviewed By: ProofAI Whisper Bot\n\n` +
              `Summary:\n${summary.summary || 'No summary available.'}\n`;

            try {
              // Send the correctly structured request to match the API expectations
              const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  summary: updatedSummary,
                  formattedSummary,
                  options: {
                    watermark: false,
                    confidential: true,
                    includeSignature: true,
                    includeTimestamps: true
                  }
                })
              });

              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ProofAI_Report.pdf";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                console.log("📄 PDF downloaded successfully.");
              } else {
                const error = await response.json();
                console.error("❌ PDF generation failed:", error);
              }
            } catch (err) {
              console.error("❌ Error generating PDF:", err);
            }
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors inline-block"
        >
          🔽 Download Legal Report
        </button>
      </div>
    </div>
  );
}
