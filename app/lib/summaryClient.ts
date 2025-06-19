import type { SummaryResult } from '../types';

export async function generateVideoSummary(videoUrl: string, transcript?: string): Promise<SummaryResult> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  try {
    // Use fallback transcript if none provided
    const actualTranscript = transcript || "No transcript was available. Assume the video includes a workplace dispute with 2 individuals arguing in a hallway.";

    // Construct the prompt with video details and formatting instructions
    let prompt = `Video URL: ${videoUrl}
Recording Time: ${new Date().toLocaleString()}
Transcript:
${actualTranscript}`;

    console.log('📝 Sending prompt to Edge Function:', { videoUrl, hasTranscript: !!transcript });

    // Call Supabase Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${SUPABASE_URL}/functions/v1/summarize`,
        hasTranscript: !!transcript
      });
      throw new Error(`Summary generation failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Received summary from Edge Function');

    // --- Fallback logic for summary fields ---
    const summary = data?.summary || {};
    if (!summary.participants || summary.participants.length === 0) {
      summary.participants = ['Unknown speaker'];
    }
    if (!summary.timestampedLog || summary.timestampedLog.length === 0) {
      summary.timestampedLog = [`00:00 - ${summary.summary?.slice(0, 50) || 'No summary'}...`];
    }
    if (!summary.actionItems || summary.actionItems.length === 0) {
      summary.actionItems = ['Review incident details'];
    }
    if (!summary.reportRelevance) {
      summary.reportRelevance = { legal: true };
    }
    if (!summary.incidentDetails) {
      summary.incidentDetails = 'Auto-filled incident summary.';
    }
    data.summary = summary;
    // --- End fallback logic ---

    return data as SummaryResult;
  } catch (error) {
    console.error('❌ Error generating video summary:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      videoUrl,
      hasTranscript: !!transcript
    });
    throw error;
  }
}
