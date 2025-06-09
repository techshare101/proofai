import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { summary, formattedSummary, options } = body;

    if (!summary || typeof summary !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing or invalid summary object' }, { status: 400 });
    }

    if (!formattedSummary || typeof formattedSummary !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing formatted summary string' }, { status: 400 });
    }

    const caseId = summary.caseId || `CASE-${Date.now()}`;
    const filename = `report-${caseId}.pdf`;

    // Simulate PDF generation using Buffer (replace with actual logic if needed)
    const pdfBuffer = Buffer.from(formattedSummary, 'utf-8');

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from('reports').getPublicUrl(filename);
    if (!data?.publicUrl) {
      return NextResponse.json({ success: false, error: 'Failed to retrieve public URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      filename
    });

  } catch (err: any) {
    console.error('❌ PDF API Error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Unexpected error generating PDF'
    }, { status: 500 });
  }
}
