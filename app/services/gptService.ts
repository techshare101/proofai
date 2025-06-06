type ContentItem = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: ContentItem[];
}

interface StructuredSummary {
  title: string;
  summary: string;
  keyParticipants: string;
  time: string;
  location: string;
  legalRelevance: string;
}

export class GPTService {
  private static apiKey = process.env.OPENAI_API_KEY;
  private static apiEndpoint = 'https://api.openai.com/v1/chat/completions';

  public static async generateLegalSummary(transcriptText: string, imageURL?: string): Promise<StructuredSummary> {
    try {
      const messages: Message[] = [
        {
          role: 'system',
          content: [{ 
            type: 'text' as const, 
            text: `You are a legal professional analyzing video evidence. Your role is to:
1. Extract key information from transcripts and images
2. Create structured summaries focused on legal implications
3. Present findings in YAML format with required fields
4. Maintain professional tone and factual analysis

If content is unclear:
- Focus on available facts
- Note specific missing details
- Suggest follow-up questions

Never mention AI or model capabilities - stay in role as legal analyst.`
          }]
        },
        {
          role: 'user',
          content: [
            { type: 'text' as const, text: `Legal Evidence Analysis Request

Evidence Type: ${imageURL ? 'Video Recording with Frame Capture' : 'Video Recording'}
Analysis Scope: Content, Context, and Legal Implications
Required Format: YAML with structured fields

Available Evidence:
${imageURL ? '- Visual Reference (Frame Capture)' : ''}
- Full Transcript

Please analyze the following evidence and provide a structured legal summary:` },
            ...(imageURL ? [{ type: 'image_url' as const, image_url: { url: imageURL } }] : []),
            { type: 'text' as const, text: `Evidence Transcript:\n${transcriptText}` }
          ]
        }
      ];

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          max_tokens: 1000,
          temperature: 0.7,
          response_format: { type: 'text' },
          messages
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate summary');
      }

      const data = await response.json();
      const yamlContent = data.choices[0]?.message?.content || '';
      
      // Parse YAML-like content into structured format
      const lines = yamlContent.split('\n');
      const summary: Partial<StructuredSummary> = {};
      
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        switch (key.trim().toLowerCase()) {
          case 'title':
            summary.title = value;
            break;
          case 'summary':
            summary.summary = value;
            break;
          case 'key participants':
            summary.keyParticipants = value;
            break;
          case 'time':
            summary.time = value;
            break;
          case 'location':
            summary.location = value;
            break;
          case 'legal relevance':
            summary.legalRelevance = value;
            break;
        }
      });

      return {
        title: summary.title || 'Untitled Incident',
        summary: summary.summary || 'No summary provided',
        keyParticipants: summary.keyParticipants || 'Not specified',
        time: summary.time || new Date().toLocaleString(),
        location: summary.location || 'Location not specified',
        legalRelevance: summary.legalRelevance || 'Legal relevance not specified'
      };
    } catch (error) {
      console.error('GPT API error:', error);
      throw new Error('Failed to generate legal summary');
    }
  }
}
