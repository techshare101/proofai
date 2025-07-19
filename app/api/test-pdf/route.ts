import { NextRequest, NextResponse } from 'next/server';
import { ClientPDFService } from '../../services/clientPdfService';

// This endpoint allows us to test PDF generation with a known good payload
export async function GET() {
  try {
    console.log('[TEST-PDF] Creating test PDF with known good data');
    
    // Create a sample summary with all required fields
    const testSummary = {
      caseId: 'test-case-' + Date.now().toString().slice(-6),
      summary: 'This is a test summary for PDF generation.',
      address: '123 Test Street, Test City, TS 12345',
      reportDate: new Date().toLocaleDateString(),
      participants: ['John Doe', 'Jane Smith'],
      relevance: 'High',
      translatedTranscript: 'This is a translated transcript for testing purposes.',
      rawTranscript: 'This is the original transcript for testing purposes.',
      detectedLanguage: 'en',
      videoUrl: 'https://proofai.app/view/test-case-1234'
    };
    
    console.log('[TEST-PDF] Test data:', testSummary);
    
    // Generate PDF with test data
    const pdfUrl = await ClientPDFService.generatePDFReport(testSummary);
    
    console.log('[TEST-PDF] PDF generation successful:', pdfUrl);
    
    // Return success response with the URL
    return NextResponse.json({ 
      success: true, 
      message: 'PDF generated successfully',
      pdfUrl 
    });
    
  } catch (error) {
    console.error('[TEST-PDF] Error generating test PDF:', error);
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack
      }, 
      { status: 500 }
    );
  }
}
