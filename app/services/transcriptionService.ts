export class TranscriptionService {
  private static instance: TranscriptionService;
  private apiKey: string;

  private constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
  }

  public static async getInstance(): Promise<TranscriptionService> {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  public async transcribe(audioBlob: Blob): Promise<string> {
    try {
      // Convert Blob to File with .wav extension
      const audioFile = new File([audioBlob], 'audio.wav', { type: audioBlob.type });

      // Create form data
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      console.log('🎙️ Audio sent to Whisper API');

      // Call OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Transcription failed');
      }

      const data = await response.json();
      const transcript = data.text;

      console.log('📄 Whisper transcript: ' + transcript);
      console.log('📤 Sending to GPT:' + transcript);

      return transcript;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}
