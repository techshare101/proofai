import { NextRequest, NextResponse } from 'next/server';
import { ServerTranscriptionService } from '../../services/serverTranscriptionService';
import { supabase } from '../../lib/supabase';

export async function POST(request: NextRequest) {
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
