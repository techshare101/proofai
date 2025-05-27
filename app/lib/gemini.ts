import type { SummaryResult } from '../types';

export async function generateSummary(prompt: string) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is missing');

  console.log('🧠 Sending prompt to Gemini:', prompt);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API request failed: ${errorText}`);
    }

    const result = await response.json();
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No summary returned.';
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
      success: true,
      summary,
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'An unknown error occurred',
    };
  }
}
