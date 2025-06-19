import { NextRequest, NextResponse } from 'next/server';
import { ServerTranscriptionService } from '../../services/serverTranscriptionService';
import { getSupabaseClient } from '../../lib/supabase';

export async function POST(request: NextRequest) {
  // Debug: Log environment variables
  console.log('API Environment check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'missing',
    allEnvKeys: Object.keys(process.env).filter(key => !key.includes('PASSWORD') && !key.includes('TOKEN')),
    nodeEnv: process.env.NODE_ENV
  });
  try {
    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const language = formData.get('language') as string;
    const translateToEnglish = formData.get('translateToEnglish') === 'true';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob for OpenAI API
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

    // Initialize server-side transcription service
    const transcriptionService = ServerTranscriptionService.getInstance();
    
    // Transcribe the audio
    const result = await transcriptionService.transcribe(
      audioBlob as any, // OpenAI API accepts Blob
      language || '',
      translateToEnglish
    );

    // Store transcript data in Supabase if we're in a production environment
    if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const transcriptData = {
          text: result.text,
          languageCode: result.languageCode,
          languageLabel: result.languageLabel,
          correctedFrom: result.correctedFrom,
          createdAt: new Date().toISOString()
        };
        
        // Save to Supabase
        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from('transcriptions')
          .insert(transcriptData);
        
        if (error) {
          console.error('❌ Error saving transcript to Supabase:', error);
        } else {
          console.log('✅ Transcript saved to Supabase');
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
