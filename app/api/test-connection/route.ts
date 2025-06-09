import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test the connection by attempting to count recordings
    const { count, error } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '✅ Supabase connection successful',
      count 
    });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to Supabase' },
      { status: 500 }
    );
  }
}
