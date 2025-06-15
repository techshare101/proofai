import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/supabase';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing environment variables: ' +
        (!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : '') +
        (!supabaseKey ? 'SUPABASE_SERVICE_KEY' : '')
      );
    }

    // Create server-side Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Test the connection
    const { count, error } = await supabase
      .from('recordings')
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
