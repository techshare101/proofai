import { NextRequest, NextResponse } from 'next/server';
import { ServerTranscriptionService } from '../../services/serverTranscriptionService';
import { getSupabaseClient } from '../../lib/supabaseClient';

export async function POST(request: NextRequest) {
  // Debug: Log environment variables
  console.log('API Environment check:', {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'missing',
    allEnvKeys: Object.keys(process.env).filter(key => !key.includes('PASSWORD') && !key.includes('TOKEN')),
    nodeEnv: process.env.NODE_ENV
  });
  try {
    // Get either the audio file or URL from the request
    const formData = await request.formData();
    
    // Check if we're receiving a file URL instead of a file
    const fileUrl = formData.get('fileUrl') as string;
    const language = formData.get('language') as string;
    const translateToEnglish = formData.get('translateToEnglish') === 'true';
    
    let audioBlob: Blob;
    
    if (fileUrl) {
      // If we have a URL, fetch the file
      console.log('🔄 Fetching audio from URL:', fileUrl.substring(0, 50) + '...');
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch audio from URL: ${response.status} ${response.statusText}` },
          { status: 502 }
        );
      }
      
      // Convert to blob
      const buffer = await response.arrayBuffer();
      audioBlob = new Blob([buffer], { type: response.headers.get('content-type') || 'audio/webm' });
      
      console.log('✅ Successfully fetched audio file:', {
        size: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
        type: audioBlob.type
      });
    } else {
      // Get the audio file from the request
      const audioFile = formData.get('file') as File;
      
      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file or URL provided' },
          { status: 400 }
        );
      }
      
      // Convert File to Blob for OpenAI API
      const audioBuffer = await audioFile.arrayBuffer();
      audioBlob = new Blob([audioBuffer], { type: audioFile.type });
    }

    // audioBlob is now prepared from either file upload or URL fetch

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
