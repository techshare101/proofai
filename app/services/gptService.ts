import { OpenAI } from 'openai';
import { StructuredSummary } from '../types/pdf';

type ContentItem = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: ContentItem[];
}

export class GPTService {
  private static async callAiApi(action: string, data: any) {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI API call failed');
    }

    const result = await response.json();
    return result.result;
  }

  public static async detectLanguageWithGPT(text: string): Promise<string> {
    try {
      return await this.callAiApi('detectLanguage', { text });
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error('Failed to detect language');
    }
  }

  public static async translateTranscriptWithGPT(
    text: string,
    targetLanguage: string = 'English'
  ): Promise<string> {
    try {
      return await this.callAiApi('translate', { text, targetLanguage });
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  public static async generateLegalSummary(transcriptText: string, imageURL?: string): Promise<StructuredSummary> {
    try {
      const yamlContent = await this.callAiApi('generateSummary', { transcriptText, imageURL });
      
      // Parse YAML-like content into structured format
      const lines = yamlContent.split('\n');
      const parsedSummary: Partial<StructuredSummary> = {};
      
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        switch (key.trim().toLowerCase()) {
          case 'summary':
            parsedSummary.summary = value;
            break;
          case 'participants':
            parsedSummary.participants = value.split(',').map(p => p.trim());
            break;
          case 'location':
            parsedSummary.location = value;
            break;
          case 'legal relevance':
            parsedSummary.reportRelevance = {
              legal: value.toLowerCase().includes('relevant')
            };
            break;
        }
      });

      const now = new Date().toISOString();
      return {
        caseId: `CASE-${Date.now()}`,
        reportDate: now,
        summary: parsedSummary.summary || 'No summary provided',
        location: parsedSummary.location || 'Location not specified',
        participants: parsedSummary.participants || [],
        reportRelevance: parsedSummary.reportRelevance || {
          legal: true
        }
      };
    } catch (error) {
      console.error('GPT API error:', error);
      throw new Error('Failed to generate legal summary');
    }
  }
}
