import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Create a small test audio file (1 second of silence in WAV format)
    const testAudioPath = path.join(process.cwd(), 'public', 'test-audio.wav');
    
    // Check if test file exists, if not create it
    if (!fs.existsSync(testAudioPath)) {
      // This is a minimal WAV header for 1 second of silence (16-bit, 16kHz, mono)
      const wavHeader = Buffer.from(
        '524946460000000057415645666D74201000000001000100401F0000803E0000020010006461746100000000',
        'hex'
      );
      
      // Add 32000 bytes of silence (16kHz * 16-bit * 1 second / 8 bits)
      const silence = Buffer.alloc(32000, 0);
      const wavFile = Buffer.concat([wavHeader, silence]);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(testAudioPath), { recursive: true });
      fs.writeFileSync(testAudioPath, wavFile);
    }

    // Read the test audio file
    const audioFile = fs.createReadStream(testAudioPath);
    
    // @ts-ignore - The types don't match exactly but this works with the API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully transcribed audio with Whisper',
      transcription: transcription.text || 'No speech detected',
    });
  } catch (error) {
    console.error('Whisper API test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio with Whisper',
        message: error.message,
        code: error.code,
        status: error.status,
        type: error.type,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
      },
      { status: 502 }
    );
  }
}
