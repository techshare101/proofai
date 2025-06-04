import { NextRequest, NextResponse } from 'next/server';
import { PDFService, SummaryData } from '../../services/pdfService'; // Adjusted path

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestData = body.data as Partial<SummaryData>; // Expect data under a 'data' key

    if (!requestData || !requestData.summary) {
      return NextResponse.json({ success: false, error: 'Missing required summary data in request body under "data" key.' }, { status: 400 });
    }

    // Prepare data with fallbacks, ensuring it matches SummaryData structure
    const processedData: SummaryData = {
      summary: {
        title: requestData.summary.title || 'ProofAI Report',
        summary: requestData.summary.summary || 'No summary provided.',
        keyParticipants: requestData.summary.keyParticipants || 'N/A',
        time: requestData.summary.time || new Date().toLocaleString(),
        location: requestData.summary.location || 'Unknown',
        legalRelevance: requestData.summary.legalRelevance || 'No specific legal relevance noted.',
      },
      transcript: requestData.transcript || requestData.transcriptText || 'No transcript available.',
      frameUrl: requestData.frameUrl || undefined,
      metadata: {
        caseId: requestData.metadata?.caseId || undefined,
        userName: requestData.metadata?.userName || undefined,
      }
    };

    const pdfBuffer = PDFService.generateSummaryPDF(processedData);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('PDF Generation Error: Buffer is undefined or empty.');
      throw new Error('PDF generation failed: Buffer is undefined or empty.');
    }

    console.log('✅ PDF generated successfully. Buffer length:', pdfBuffer.length);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'attachment; filename="ProofAI_Report.pdf"'); // Added quotes for filename

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: headers,
    });

  } catch (error: any) {
    console.error('PDF Generation Route Error:', error);
    const errorMessage = error.message || 'Failed to generate PDF due to an unexpected error.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
