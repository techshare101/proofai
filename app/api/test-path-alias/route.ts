import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Test the @ alias by importing from the root
import { stripe } from '@/lib/stripe/config';

export async function GET() {
  try {
    // If we get here, the import worked
    const testObj = {
      status: 'success',
      message: 'Path alias test successful!',
      stripeConfigured: !!stripe,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(testObj);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Path alias test failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
