import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Test the connection by attempting to count recordings
    const { count, error } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      count 
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to connect to Supabase';
    console.error('Error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
