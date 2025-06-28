import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    // Test the connection
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      count 
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to connect to Supabase';
    console.error('Server error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
