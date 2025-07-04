export const dynamic = "force-dynamic"; // Disable static rendering

import { NextResponse } from 'next/server';
import { generatePDF } from '@/utils/generatePDF';
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase securely using env vars and proper options
// This ensures no session is persisted when using service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false } // Important security practice
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[PDF API] Incoming request body:', body);

    // Extract data from the body following the existing structure
    const { structuredSummary } = body;
    
    if (!structuredSummary) {
      console.error('[PDF API] Missing required fields:', { structuredSummary: !!structuredSummary });
      return NextResponse.json(
        { success: false, error: 'Missing required field: structuredSummary' },
        { status: 400 }
      );
    }

    // Simplified implementation that preserves Supabase functionality
    const caseId = structuredSummary.caseId || `case-${Date.now()}`;
    
    try {
      // Generate the PDF using the new implementation
      const pdfBytes = await generatePDF(structuredSummary);
      
      // If user requested Supabase upload, handle it
      if (body.uploadToSupabase && pdfBytes) {
        try {
          const filename = `${caseId}-${Date.now()}.pdf`;
          console.log('[PDF API] Uploading to Supabase as:', filename);
          
          const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(filename, pdfBytes, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (!uploadError) {
            // Get the public URL for the uploaded file
            const { data: publicUrlData } = supabase.storage
              .from('reports')
              .getPublicUrl(filename);

            const publicUrl = publicUrlData?.publicUrl;
            if (publicUrl) {
              console.log('[PDF API] ✅ PDF successfully uploaded:', publicUrl);
              return NextResponse.json({
                success: true, 
                publicUrl,
                metadata: {
                  caseId,
                  reportDate: new Date().toISOString(),
                  location: structuredSummary.location || 'Unknown Location'
                }
              });
            }
          }
        } catch (uploadErr) {
          console.error('[PDF API] ❌ Supabase upload exception:', uploadErr);
          // Continue to return the PDF directly
        }
      }

      // If we reach here, either no upload was requested or upload failed
      console.log('[PDF API] Returning PDF as direct download');
      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=proofai-report-${caseId}.pdf`
        }
      });
    } catch (err: any) {
      console.error('[PDF API] Error during PDF generation:', err);
      return NextResponse.json(
        { success: false, error: err.message || 'Unknown server error' },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('[PDF API] Error parsing request:', err);
    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    );
  }
}
