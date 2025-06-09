import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'detectLanguage': {
        const { text } = data;
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          temperature: 0,
          messages: [
            { 
              role: 'user', 
              content: `Identify the ISO 639-1 language code (e.g., "en", "fr", "es") of the following text:\n\n"${text.slice(0, 400)}"` 
            }
          ]
        });
        return NextResponse.json({ result: response.choices[0].message.content.trim().toLowerCase() });
      }

      case 'translate': {
        const { text, targetLanguage } = data;
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following into ${targetLanguage}.`
            },
            {
              role: 'user',
              content: text
            }
          ]
        });
        return NextResponse.json({ result: response.choices[0].message.content.trim() });
      }

      case 'generateSummary': {
        const { transcriptText, imageURL } = data;
        const messages = [
          {
            role: 'system',
            content: `You are a legal professional analyzing video evidence. Your role is to:
1. Extract key information from transcripts and images
2. Create structured summaries focused on legal implications
3. Present findings in YAML format with required fields
4. Maintain professional tone and factual analysis

If content is unclear:
- Focus on available facts
- Note specific missing details
- Suggest follow-up questions

Never mention AI or model capabilities - stay in role as legal analyst.`
          },
          {
            role: 'user',
            content: `Legal Evidence Analysis Request

Evidence Type: ${imageURL ? 'Video Recording with Frame Capture' : 'Video Recording'}
Analysis Scope: Content, Context, and Legal Implications
Required Format: YAML with structured fields

Available Evidence:
${imageURL ? '- Visual Reference (Frame Capture)' : ''}
- Full Transcript

Please analyze the following evidence and provide a structured legal summary:

Evidence Transcript:
${transcriptText}`
          }
        ];

        const response = await openai.chat.completions.create({
          model: imageURL ? 'gpt-4-vision-preview' : 'gpt-4',
          temperature: 0.7,
          messages: messages as any,
        });

        return NextResponse.json({ result: response.choices[0].message.content });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
