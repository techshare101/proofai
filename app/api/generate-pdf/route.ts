import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePDF } from '../../utils/generatePDF';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // --- DEBUG: Log incoming request body ---
    const bodyText = await req.text();
    console.log('[PDF API] Raw request body:', bodyText);
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error('[PDF API] Failed to parse JSON:', e);
      return new Response('PDF generation failed: Invalid JSON body', { status: 400 });
    }
    const { summary, formattedSummary, options } = body;
    console.log('[PDF API] summary:', summary);
    console.log('[PDF API] formattedSummary:', formattedSummary);
    console.log('[PDF API] options:', options);

    if (!summary || typeof summary !== 'object') {
      console.error('[PDF API] summary missing or not an object:', summary);
      return new Response('PDF generation failed: Missing or invalid summary object', { status: 400 });
    }

    if (!formattedSummary || typeof formattedSummary !== 'string') {
      console.error('[PDF API] formattedSummary missing or not a string:', formattedSummary);
      return new Response('PDF generation failed: Missing formatted summary string', { status: 400 });
    }

    const caseId = summary.caseId || `CASE-${Date.now()}`;
    const filename = `report-${caseId}.pdf`;

    // DEBUG: Log before PDF generation
    console.log('[PDF API] Calling generatePDF with summary:', summary);
    console.log('[PDF API] 🌎 Location being sent to PDF generator:', summary.location);
    const pdfBuffer = Buffer.from(
      await generatePDF({
        content: formattedSummary,
        caseId,
        generatedBy: 'ProofAI Whisper Bot',
        options: options || {},
        structuredSummary: summary
      })
    );
    // ✅ Add this line right after generating the buffer:
    console.log('[PDF API] PDF buffer length:', pdfBuffer.length);

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

  } catch (error: any) {
    console.error('[PDF API] PDF generation error:', error);
    return new Response(`PDF generation failed: ${error?.message || error}`, { status: 500 });
  }
}
