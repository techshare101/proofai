console.log("[PDF-ROUTE] ACTIVE: this is the real route.ts");

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadPdfToSupabase, getSignedPdfUrl } from '../../utils/uploadPdfToSupabase';
import { generatePDF } from '../../utils/generatePDF';

async function fetchWhisperDataFromDatabase(supabase, caseId: string) {
  try {
    console.log(`[WHISPER-FETCH] Attempting to fetch whisper data for caseId: ${caseId}`);
    // Attempt transcripts table
    try {
      const { data } = await supabase
        .from('transcripts')
        .select('transcript')
        .eq('case_id', caseId)
        .single();
      if (data?.transcript) {
        console.log('[WHISPER-FETCH] Found transcript in transcripts table.');
        return { transcript: data.transcript };
      }
    } catch {}
    // Attempt recordings table
    try {
      const { data } = await supabase
        .from('recordings')
        .select('transcript')
        .eq('case_id', caseId)
        .single();
      if (data?.transcript) {
        console.log('[WHISPER-FETCH] Found transcript in recordings table.');
        return { transcript: data.transcript };
      }
    } catch {}
    // Attempt raw_transcripts table
    try {
      const { data } = await supabase
        .from('raw_transcripts')
        .select('content')
        .eq('case_id', caseId)
        .single();
      if (data?.content) {
        console.log('[WHISPER-FETCH] Found transcript in raw_transcripts table.');
        return { transcript: data.content };
      }
    } catch {}

    console.log('[WHISPER-FETCH] No transcript found in any table.');
    return null;
  } catch (err) {
    console.error('[WHISPER-FETCH] Unexpected error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[PDF-GENERATION] Received PDF generation request');
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const structuredSummary = body.structuredSummary || body;

    // Merge transcript fields from body
    if (!structuredSummary.originalTranscript && body.originalTranscript) {
      structuredSummary.originalTranscript = body.originalTranscript;
    }
    if (!structuredSummary.transcript && body.transcript) {
      structuredSummary.transcript = body.transcript;
    }
    if (!structuredSummary.rawTranscript && body.rawTranscript) {
      structuredSummary.rawTranscript = body.rawTranscript;
    }

    // Normalize transcript fields
    body.transcript = structuredSummary.transcript || '';
    body.originalTranscript =
      structuredSummary.originalTranscript ||
      structuredSummary.original_transcript ||
      body.transcript ||
      '';
    body.rawTranscript =
      structuredSummary.rawTranscript || structuredSummary.raw_transcript || body.transcript || '';
    body.translatedTranscript =
      structuredSummary.translatedTranscript || structuredSummary.translated_transcript || '';

    // 📌 FIXED LOCATION PRIORITIZATION
    body.location =
      structuredSummary.address ||
      structuredSummary.geocode?.address ||
      structuredSummary.location ||
      body.address ||
      body.geocode?.address ||
      body.location ||
      'Unknown Location';
    body.caseId =
      structuredSummary.caseId ||
      structuredSummary.case_id ||
      body.caseId ||
      `case-${Date.now()}`;

    console.log('[PDF-ROUTE] Transcript fields before generation:', {
      originalTranscriptLength: body.originalTranscript?.length || 0,
      translatedTranscriptLength: body.translatedTranscript?.length || 0
    });

    // Handle Whisper override
    if (body.whisper?.transcript || body.whisper?.text) {
      const whisperText = body.whisper.transcript || body.whisper.text || '';
      console.log('[PDF-WHISPER] Whisper text length:', whisperText.length);
      if (whisperText && whisperText.trim().length > 0) {
        body.originalTranscript = whisperText;
        body.transcript = whisperText;
        body.rawTranscript = whisperText;
        console.log('[PDF-WHISPER] Overriding transcript fields with Whisper data.');
      } else {
        console.log('[PDF-WHISPER] Whisper present but empty, keeping existing transcripts.');
      }
    } else {
      console.log('[PDF-WHISPER] No Whisper transcript present.');
    }

    // Consolidate data
    const consolidatedData: any = {
      ...body,
      transcript:
        body.transcript ||
        structuredSummary.transcript ||
        structuredSummary.originalTranscript ||
        '',
      originalTranscript:
        body.originalTranscript ||
        structuredSummary.originalTranscript ||
        body.transcript ||
        '',
      rawTranscript:
        body.rawTranscript || structuredSummary.rawTranscript || body.transcript || '',
      translatedTranscript:
        body.translatedTranscript || structuredSummary.translatedTranscript || ''
    };

    // Ensure underscore naming as well
    consolidatedData.original_transcript = consolidatedData.originalTranscript;
    consolidatedData.raw_transcript = consolidatedData.rawTranscript;
    consolidatedData.translated_transcript = consolidatedData.translatedTranscript;

    console.log('🧠 Consolidated data for PDF:', {
      caseId: consolidatedData.caseId,
      location: consolidatedData.location,
      originalTranscriptLength: consolidatedData.originalTranscript?.length || 0,
      translatedTranscriptLength: consolidatedData.translatedTranscript?.length || 0
    });

    // Generate the PDF
    const pdfBytes = await generatePDF(consolidatedData);

    // Upload to Supabase if userId is present
    const userId = body.userId || structuredSummary.userId;
    if (userId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const supabaseKey =
          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SERVICE_KEY ||
          '';
        const supabase = createClient(supabaseUrl, supabaseKey);
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const customFilename = `case-${consolidatedData.caseId}-${Date.now()}.pdf`;
        const storagePath = await uploadPdfToSupabase(supabase, userId, pdfBlob, customFilename);
        const signedUrl = await getSignedPdfUrl(supabase, storagePath, 3600 * 24);
        return NextResponse.json({ success: true, publicUrl: signedUrl, storagePath });
      } catch (err) {
        console.error('[PDF-SUPABASE-UPLOAD-ERROR]', err);
      }
    }

    // Fallback: return PDF directly
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proofai-case-${consolidatedData.caseId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('[PDF-GENERATION-ERROR]', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF', message: error.message }),
      { status: 500 }
    );
  }
}
