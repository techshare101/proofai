export interface TranscriptionResult {
  text: string;
  transcript?: string;
  rawTranscript?: string;
  detectedLanguage?: string;
  language?: string;
  supported_language?: string;
}

interface TranslationResult {
  text: string;
  sourceLanguage: string;
}

function detectLanguage(text: string): string {
  const sample = text.slice(0, 120).toLowerCase();

  if (sample.match(/[àâçéèêëîïôùûüÿœ]/)) return 'fr';
  if (sample.match(/[áéíóúñ]/)) return 'es';
  if (sample.match(/[а-яА-Я]/)) return 'ru';
  if (sample.match(/[中日語汉]/)) return 'zh';
  return 'en';
}

export class TranscriptionService {
  private static instance: TranscriptionService;

  private constructor() {
    // No initialization needed for client-side service
  }

  public static async getInstance(): Promise<TranscriptionService> {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  public async transcribe(audioInput: Blob | string, language = '', translateToEnglish = false): Promise<TranscriptionResult> {
    console.log('🎙️ Starting Whisper transcription...', {
      inputType: typeof audioInput === 'string' ? 'URL' : 'Blob',
      blobType: typeof audioInput !== 'string' ? audioInput.type : 'N/A',
      blobSize: typeof audioInput !== 'string' ? `${(audioInput.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      language: language || 'auto-detect'
    });
    try {
      let formDataForAPI = new FormData();
      
      // Handle both Blob and URL inputs
      if (typeof audioInput === 'string') {
        // If input is a URL, pass it directly to the API
        console.log('🎙️ Using audio URL:', audioInput.substring(0, 100) + '...');
        formDataForAPI.append('fileUrl', audioInput);
      } else {
        // Handle as Blob - convert to File first
        const extension = audioInput.type === 'video/webm' ? 'webm' : 'mp4';
        const audioFile = new File([audioInput], `audio.${extension}`, { type: audioInput.type });
        
        // Log file details
        console.log('🎙️ Audio file details:', {
          name: audioFile.name,
          type: audioFile.type,
          size: `${(audioFile.size / 1024 / 1024).toFixed(2)} MB`,
          extension
        });
        
        formDataForAPI.append('file', audioFile);
      }

      // Add common parameters
      console.log('💿 Sending to Whisper API:', {
        inputType: typeof audioInput === 'string' ? 'URL' : 'File',
        fileType: typeof audioInput !== 'string' ? audioInput.type : 'from URL',
        language: language || 'auto',
        endpoint: 'transcriptions'
        // API key is handled by the server-side endpoint
      });
      // Add language parameter only if explicitly specified and not 'auto'
      // This allows Whisper to perform optimal auto-detection for all languages
      if (language && language !== 'auto' && language.trim() !== '') {
        console.log(`🔤 Passing explicit language to API: ${language}`);
        formDataForAPI.append('language', language);
      } else {
        console.log('🔤 Using auto-detection mode (no language parameter)');
        // Do not append any language parameter when auto is selected
        // This allows the API to use Whisper's best auto-detection
      }
      if (translateToEnglish) {
        formDataForAPI.append('translateToEnglish', 'true');
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formDataForAPI
      });

      if (!response.ok) {
        let error;
        const responseText = await response.text();
        console.error('❌ Transcription API raw response:', responseText);
        console.error('❌ Transcription API status:', response.status, response.statusText);
        
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { message: responseText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ Transcription API error detail:', error);
        const errorMessage = error?.error?.message || error?.details || error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Transcription failed: ${errorMessage}`);
      }

      const responseData = await response.json();
      console.log('🎙️ Transcription API Response:', responseData);

      const transcript = responseData.text;
      console.log('📝 Whisper transcript:', {
        length: transcript.length,
        preview: transcript.substring(0, 100) + '...'
      });
      console.log('📤 Full transcript:', transcript);

      // Extract detected language from response metadata if available
      let detectedLanguage = responseData.language;
      
      // If language not in response, use basic detection
      if (!detectedLanguage && transcript) {
        detectedLanguage = detectLanguage(transcript);
        console.log('🌐 Detected language from text:', detectedLanguage);
      }

      return {
        text: transcript,
        detectedLanguage
      };
    } catch (error: any) {
      console.error('❌ Transcription error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Get the error message from the response if available
      const errorMessage = error.response?.data?.error || error.message;
      
      // Check for rate limit errors
      if (errorMessage.includes('exceeded your current quota')) {
        throw new Error(
          'The transcription service is temporarily unavailable due to high demand. Please try again in a few minutes.'
        );
      }

      console.error('❌ Transcription error detail:', error);
      throw new Error(`Transcription failed: ${error?.error?.message || JSON.stringify(error)}`);
    }
  }

  public async translateToEnglish(text: string, sourceLanguage?: string): Promise<TranslationResult> {
    try {
      console.log('🔄 Starting translation to English...', {
        textLength: text.length,
        sourceLanguage: sourceLanguage || 'auto'
      });

      const formData = new FormData();
      formData.append('file', new Blob([text], { type: 'text/plain' }));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      formData.append('target_language', 'en');
      
      if (sourceLanguage) {
        formData.append('source_language', sourceLanguage);
      }

      // Use our server-side API endpoint instead of calling OpenAI directly
      const formDataForAPI = new FormData();
      formDataForAPI.append('text', text);
      if (sourceLanguage) {
        formDataForAPI.append('sourceLanguage', sourceLanguage);
      }
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        body: formDataForAPI
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Translation API error:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        throw new Error(error.error?.message || `Translation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔄 Translation complete:', {
        originalLength: text.length,
        translatedLength: data.text.length
      });

      return {
        text: data.text,
        sourceLanguage: sourceLanguage || data.detected_language || 'unknown'
      };
    } catch (error) {
      console.error('❌ Translation error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
