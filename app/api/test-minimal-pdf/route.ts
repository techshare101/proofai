import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '../../utils/generatePDF';

/**
 * Test endpoint for generating a minimal PDF
 * This helps isolate PDF generation issues from complex layout/content handling
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[TEST-PDF] Received request for comprehensive PDF test');
    
    // Rich dummy data for PDF generation - exactly matching requested format
    const testData = {
      caseId: "CASE-1751925637987",
      location: "Minneapolis, MN",
      reportDate: "2025-07-07",
      transcript: "Original transcript text goes here.\nLine two.\nLine three.",
      translatedText: "This is the English translation.\nLine two of translation.",
      participants: [
        { name: "Jane Doe", role: "Witness" },
        { name: "John Smith", role: "Security Officer" }
      ],
      relevance: "This case may impact local labor laws regarding site security access.",
      videoUrl: "https://example.com/video/case-xxxxx"
    };

    console.log('[TEST-PDF] Generating comprehensive PDF with test data');
    const pdfBytes = await generatePDF(testData);
    
    // Create response with PDF
    const response = new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=test-comprehensive.pdf'
      },
    });

    return response;
  } catch (error) {
    console.error('[TEST-PDF-ERROR]', error);
    return NextResponse.json(
      { error: `PDF generation failed: ${error.message}` },
      { status: 500 }
    );
  }
}
