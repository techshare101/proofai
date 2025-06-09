import OpenAI from 'openai';

export interface TranscriptionResult {
  text: string;
  detectedLanguage?: string;
}

export class ServerTranscriptionService {
  private static instance: ServerTranscriptionService;
  private openai: OpenAI;

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): ServerTranscriptionService {
    if (!ServerTranscriptionService.instance) {
      ServerTranscriptionService.instance = new ServerTranscriptionService();
    }
    return ServerTranscriptionService.instance;
  }

  public async transcribe(
    file: Blob,
    language = '',
    translateToEnglish = false
  ): Promise<TranscriptionResult> {
    try {
      console.log('🎤 Starting server-side transcription...', {
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        language: language || 'auto',
      });

      // Convert Blob to File for OpenAI API
      const audioFile = new File([file], 'audio.webm', { type: file.type });

      const response = await this.openai.audio[translateToEnglish ? 'translations' : 'transcriptions'].create({
        file: audioFile,
        model: 'whisper-1',
        language: language || undefined,
      });

      console.log('✅ Transcription complete');

      return {
        text: response.text,
        // OpenAI API doesn't return language for translations
        detectedLanguage: translateToEnglish ? undefined : language || 'auto',
      };
    } catch (error: any) {
      console.error('❌ Server transcription error:', error);
      
      // Handle rate limit errors
      if (error?.status === 429 || error?.message?.includes('exceeded your current quota')) {
        throw new Error(
          'API rate limit exceeded. Please try again in a few minutes or contact support if this persists.'
        );
      }

      // Handle other OpenAI API errors
      if (error?.response?.status) {
        throw new Error(
          `Transcription failed: ${error.response.data?.error?.message || error.message}`
        );
      }

      throw new Error('Transcription failed. Please try again.');
    }
  }
}
