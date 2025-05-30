import type { SummaryResult } from '../types';

export async function generateVideoSummary(videoUrl: string, transcript?: string): Promise<SummaryResult> {
  try {
    // Construct the prompt with video details and formatting instructions
    let prompt = `Please analyze this video recording and provide a detailed summary.

Video URL: ${videoUrl}
Recording Time: ${new Date().toLocaleString()}

`;

    if (transcript) {
      prompt += `Transcript:
${transcript}

`;
    }

    prompt += `Please provide your analysis in the following format:

Main event narrative:
[Provide a clear, objective description of what happened in 2-3 sentences]

Participants:
[List each person involved, their role or relationship to the event]

Key Events:
[List 3-5 key events in chronological order, each with a timestamp if available]

Context:
[Describe when and where the event took place, including any relevant environmental factors]

Notable Quotes:
[Include 2-3 significant quotes from the video, if any are available]

Legal Relevance:
[Provide a professional assessment of potential legal, HR, or safety implications. Include specific concerns and recommended follow-up actions.]

If you cannot provide a meaningful analysis, explain specifically what information is missing or unclear.`;

    // Call the Edge Function
    const response = await fetch("https://fiwtckfmtbcxryhhggsb.supabase.co/functions/v1/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate summary: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.summary) {
      throw new Error('No summary returned from the server');
    }
    
    // Parse the summary into structured data
    const result: SummaryResult = {
      summary: '',
      participants: [],
      keyEvents: [],
      context: {
        location: '',
        time: new Date().toLocaleString(),
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

    // Extract sections from the summary
    const sections = data.summary.split('\n\n');
    let mainEventFound = false;

    for (const section of sections) {
      const sectionLower = section.toLowerCase();
      if (sectionLower.includes('main event narrative:')) {
        result.summary = section.replace(/main event narrative:/i, '').trim();
        mainEventFound = true;
      } else if (sectionLower.includes('participants:')) {
        result.participants = section
          .split('\n')
          .slice(1)
          .filter(line => line.trim())
          .map(line => line.replace(/^[\s-]*/, ''));
      } else if (sectionLower.includes('key events:')) {
        result.keyEvents = section
          .split('\n')
          .slice(1)
          .filter(line => line.trim())
          .map(line => line.replace(/^[\s-]*/, ''));
      } else if (sectionLower.includes('notable quotes:')) {
        result.notableQuotes = section
          .split('\n')
          .slice(1)
          .filter(line => line.trim())
          .map(line => line.replace(/^[\s-]*/, ''));
      } else if (sectionLower.includes('legal relevance:')) {
        const relevance = section.replace(/legal relevance:/i, '').trim().toLowerCase();
        result.reportRelevance = {
          legal: relevance.includes('legal'),
          hr: relevance.includes('hr') || relevance.includes('human resources'),
          safety: relevance.includes('safety') || relevance.includes('hazard'),
          explanation: section.replace(/legal relevance:/i, '').trim()
        };
      }
    }

    // If no main event narrative found, use first section as summary
    if (!mainEventFound && sections.length > 0) {
      result.summary = sections[0].trim();
    }

    // Validate that we have a summary
    if (!result.summary) {
      throw new Error('No summary content found in response');
    }

    return result;
  } catch (error) {
    console.error('❌ Video summary error:', error);
    throw error;
  }
}
