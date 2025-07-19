import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose non-sensitive information
  return NextResponse.json({
    openaiKeyConfigured: !!process.env.OPENAI_API_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
