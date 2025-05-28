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

    // Parse the summary into structured data
    const lines = summary.split('\n');
    const result: SummaryResult = {
      summary: '',
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

    let currentSection = '';
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('Main event narrative:')) {
        result.summary = trimmedLine.replace('Main event narrative:', '').trim();
        currentSection = 'summary';
      } else if (trimmedLine.startsWith('Participants:')) {
        currentSection = 'participants';
      } else if (trimmedLine.startsWith('Key Events:')) {
        currentSection = 'events';
      } else if (trimmedLine.startsWith('Context:')) {
        currentSection = 'context';
      } else if (trimmedLine.startsWith('Notable Quotes:')) {
        currentSection = 'quotes';
      } else if (trimmedLine.startsWith('Legal Relevance:')) {
        currentSection = 'legal';
      } else {
        // Add content to the current section
        switch (currentSection) {
          case 'summary':
            result.summary += ' ' + trimmedLine;
            break;
          case 'participants':
            if (trimmedLine.startsWith('- ')) {
              result.participants.push(trimmedLine.substring(2));
            }
            break;
          case 'events':
            if (trimmedLine.startsWith('- ')) {
              result.keyEvents.push(trimmedLine.substring(2));
            }
            break;
          case 'quotes':
            if (trimmedLine.startsWith('- ')) {
              result.notableQuotes.push(trimmedLine.substring(2));
            }
            break;
          case 'legal':
            result.reportRelevance.explanation = trimmedLine;
            // Set relevance flags based on content
            result.reportRelevance.legal = trimmedLine.toLowerCase().includes('legal');
            result.reportRelevance.hr = trimmedLine.toLowerCase().includes('hr');
            result.reportRelevance.safety = trimmedLine.toLowerCase().includes('safety');
            break;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to generate summary:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
}
