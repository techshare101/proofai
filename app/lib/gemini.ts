import type { SummaryResult } from '../types';
import { callSummary } from './callSummary';

export async function generateSummary(prompt: string) {
  console.log('🧠 Sending prompt to Gemini:', prompt);

  try {
    const summary = await callSummary(prompt);
    console.log('✅ Gemini Summary:', summary);
    return summary;
  } catch (err) {
    console.error('❌ Gemini Summary Error:', err);
    throw err;
  }
}

export async function generateVideoSummary(videoUrl: string, transcript?: string): Promise<SummaryResult> {
  try {
    let prompt = `Please analyze this video recording and provide a detailed summary. The video is available at: ${videoUrl}\n\n`;

    if (transcript) {
      prompt += `Here is the transcript of the video:\n${transcript}\n\n`;
    }

    prompt += `Please include:\n` +
              `1. Main event narrative\n` +
              `2. Involved participants\n` +
              `3. Chronological events\n` +
              `4. Context (location, time)\n` +
              `5. Notable quotes\n` +
              `6. Legal relevance assessment`;

    const summary = await generateSummary(prompt);

    return {
      summary,
      participants: [],
      keyEvents: [],
      context: {
        location: '',
        time: '',
        environmentalFactors: ''
      },
      notableQuotes: [],
      legallyRelevantDetails: [],
      reportRelevance: {
        legal: false,
        hr: false,
        safety: false,
        explanation: ''
      }
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
}
