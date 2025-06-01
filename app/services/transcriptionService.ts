export class TranscriptionService {
  private static instance: TranscriptionService;
  private apiKey: string;

  private constructor() {
    // Try both environment variables
    this.apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.error('❌ OpenAI API key not found in environment variables');
      console.error('Please set either OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY');
      throw new Error('OpenAI API key not found in environment variables');
    }
    console.log('✅ OpenAI API key found');
  }

  public static async getInstance(): Promise<TranscriptionService> {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  public async transcribe(audioBlob: Blob): Promise<string> {
    console.log('🎙️ Starting Whisper transcription...', {
      blobType: audioBlob.type,
      blobSize: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`
    });
    try {
      // Convert Blob to File with appropriate extension based on type
      const extension = audioBlob.type === 'video/webm' ? 'webm' : 'wav';
      const audioFile = new File([audioBlob], `audio.${extension}`, { type: audioBlob.type });
      
      // Log file details
      console.log('🎙️ Audio file details:', {
        name: audioFile.name,
        type: audioFile.type,
        size: `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`,
        extension
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      console.log('📤 Sending to Whisper API:', {
        fileName: audioFile.name,
        fileSize: `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: audioFile.type,
        model: 'whisper-1',
        language: 'en',
        apiKey: this.apiKey ? 'Set' : 'Missing'
      });

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
        console.error('❌ Whisper API error:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        });
        throw new Error(error.error?.message || `Transcription failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🎙️ Whisper API Response:', data);
      
      if (!data.text) {
        console.error('❌ No text in Whisper response:', data);
        throw new Error('No text in Whisper response');
      }

      const transcript = data.text;
      console.log('📄 Whisper transcript:', {
        length: transcript.length,
        preview: transcript.substring(0, 100) + '...'
      });
      console.log('📤 Full transcript:', transcript);

      return transcript;
    } catch (error) {
      console.error('❌ Transcription error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
