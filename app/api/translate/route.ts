import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define response type
interface TranslationResponse {
  text: string;
  sourceLanguage: string;
}

export async function POST(request: NextRequest) {
  console.log('🔤 Translation API endpoint called');
  
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check server environment variables.' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse form data
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const sourceLanguage = formData.get('sourceLanguage') as string | null;

    // Validate input
    if (!text) {
      console.error('❌ No text provided for translation');
      return NextResponse.json(
        { error: 'No text provided for translation' },
        { status: 400 }
      );
    }

    console.log('🌐 Translating text:', {
      textLength: text.length,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sourceLanguage: sourceLanguage || 'auto'
    });

    // Create a text file from the input
    const file = new File([text], 'text.txt', { type: 'text/plain' });

    // Set up translation options
    const translationOptions: any = {
      file,
      model: 'whisper-1',
      response_format: 'json'
    };

    // Add source language if provided
    if (sourceLanguage) {
      translationOptions.language = sourceLanguage;
    }

    // Call OpenAI API for translation
    const response = await openai.audio.translations.create(translationOptions);

    console.log('✅ Translation completed successfully');

    // Return the result
    const result: TranslationResponse = {
      text: response.text,
      sourceLanguage: sourceLanguage || 'auto'
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Translation API error:', {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      code: error.code,
      type: error.type
    });

    // Handle different error types
    if (error?.status === 429 || error?.message?.includes('exceeded your current quota')) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please try again in a few minutes or contact support if this persists.'
        },
        { status: 429 }
      );
    }

    if (error?.status === 401 || error?.message?.includes('auth') || error?.message?.includes('key')) {
      return NextResponse.json(
        {
          error: 'OpenAI API authentication failed. Please check your API key configuration.'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: `Translation failed: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
