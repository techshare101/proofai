import { generatePDF } from '../app/utils/generatePDF';

async function testPdfGeneration() {
  console.log('🔍 Starting PDF generation test...');
  
  try {
    const mockData = {
      summary: 'This is a test summary.',
      participants: ['John Doe', 'Jane Smith'],
      keyEvents: ['Event 1', 'Event 2'],
      context: {
        time: '2025-05-31 13:30:00',
        location: 'Meeting Room A',
        environmentalFactors: 'Normal office conditions'
      },
      notableQuotes: ['Quote 1', 'Quote 2'],
      reportRelevance: {
        legal: true,
        hr: true,
        safety: true,
        explanation: 'This report has legal, HR, and safety implications'
      },
      videoUrl: 'https://example.com/video.mp4'
    };

    const mockOptions = {
      caseId: 'TEST-001',
      reviewedBy: 'Test Reviewer',
      confidential: true
    };

    // Log test data
    console.log('🧾 Test Data:', JSON.stringify(mockData, null, 2));
    console.log('⚙️ Options:', JSON.stringify(mockOptions, null, 2));

    // Generate PDF
    console.log('📄 Generating PDF...');
    const resultPath = await generatePDF(mockData, mockOptions);
    console.log('✅ PDF generated successfully!');
    console.log('📂 PDF saved at:', resultPath);
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

testPdfGeneration();
