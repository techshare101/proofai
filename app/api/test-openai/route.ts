import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
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

    // Test the API with a simple completion
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Say this is a test',
        },
      ],
      model: 'gpt-3.5-turbo',
      max_tokens: 10,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to OpenAI API',
      model: completion.model,
      response: completion.choices[0]?.message?.content || 'No content',
    });
  } catch (error) {
    console.error('OpenAI API test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to OpenAI API',
        message: error.message,
        code: error.code,
        status: error.status,
        type: error.type,
      },
      { status: 502 }
    );
  }
}
