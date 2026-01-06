export const dynamic = "force-dynamic"; // Disable static rendering

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { generatePDF } from '@/utils/generatePDF'; // Adjusted import path

// Lazy-initialize Supabase to avoid build-time errors
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(url, key);
}

// Handle PDF generation and upload to Supabase Storage
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { summary, formattedSummary, options } = body;
    
    // Input validation
    if (!summary || typeof summary !== 'object') {
      console.error('[PDF API] summary missing or not an object:', summary);
      return NextResponse.json({ error: 'Missing or invalid summary object' }, { status: 400 });
    }

    if (!formattedSummary || typeof formattedSummary !== 'string') {
      console.error('[PDF API] formattedSummary missing or not a string:', formattedSummary);
      return NextResponse.json({ error: 'Missing formatted summary string' }, { status: 400 });
    }

    const caseId = summary.caseId || `CASE-${Date.now()}`;
    const filename = `proofai-report-${caseId}.pdf`;
    // Storage path - just the path relative to bucket root
    const storagePath = `reports/${filename}`;

    // Generate PDF
    console.log('[PDF API] Generating PDF for case:', caseId);
    if (summary.location) {
      console.log('[PDF API] Location:', summary.location);
    }
    
    // Debug log transcript and language data
    console.log('[PDF API] Transcript data check:', {
      hasTranscript: !!summary.transcript,
      transcriptLength: summary.transcript?.length || 0,
      hasOriginalTranscript: !!summary.originalTranscript,
      originalTranscriptLength: summary.originalTranscript?.length || 0,
      language: summary.language || 'Not specified',
    });
    
    // If transcript available, log excerpt
    if (summary.transcript && summary.transcript.length > 0) {
      console.log('[PDF API] Transcript excerpt:', summary.transcript.substring(0, 100) + '...');
    }
    
    // If original transcript available, log excerpt
    if (summary.originalTranscript && summary.originalTranscript.length > 0) {
      console.log('[PDF API] Original transcript excerpt:', summary.originalTranscript.substring(0, 100) + '...');
    }
    
    const pdfBuffer = Buffer.from(
      await generatePDF({
        content: formattedSummary,
        caseId,
        generatedBy: 'ProofAI Whisper Bot',
        options: options || {},
        structuredSummary: summary
      })
    );
    
    console.log('[PDF API] PDF buffer length:', pdfBuffer.length);

    // Upload PDF to Supabase Storage
    const supabase = getSupabase();
    console.log('[PDF API] Uploading PDF to storage:', storagePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proofai-pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('[PDF API] Storage upload error:', uploadError);
      // Fallback: return PDF directly for download if storage fails
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${filename}`,
        },
      });
    }

    console.log('[PDF API] PDF uploaded successfully:', uploadData.path);

    // Get public URL for the uploaded PDF
    const { data: urlData } = supabase.storage
      .from('proofai-pdfs')
      .getPublicUrl(storagePath);

    console.log('[PDF API] Public URL:', urlData.publicUrl);

    // Return JSON with the storage URL (not blob URL)
    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: storagePath, // Also return path for future signed URL generation
      success: true 
    });

  } catch (error: any) {
    console.error('[PDF API] PDF generation error:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
