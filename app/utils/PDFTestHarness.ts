import { generatePDF } from './generatePDF';
import fs from 'fs';
import path from 'path';

/**
 * Test harness for PDF generation with various test cases
 * This is a utility for development and testing only
 */

// Define test cases with different edge cases
const TEST_CASES = [
  // Real-world test case with proper transcript data
  {
    name: 'real_data_test',
    data: {
      caseId: "CASE-20250710X",
      transcript: "This is the original audio transcript. It should appear on page 2.",
      translatedTranscript: "Voici la transcription traduite. Elle doit apparaître sur la première page.",
      location: "Minneapolis, MN",
      reportDate: "2025-07-10T14:03:00Z",
      participants: [
        { name: "John Doe", role: "Observer" },
        { name: "Jane Smith", role: "Reporter" }
      ],
      videoUrl: "https://example.com/video.mp4"
    }
  },
  {
    name: 'complete_data',
    data: {
      caseId: 'CASE-12345',
      reportDate: new Date().toISOString(),
      address: '123 Main Street, Anytown, USA',
      participants: [
        { name: 'John Doe', role: 'Interviewer' },
        { name: 'Jane Smith', role: 'Witness' }
      ],
      transcript: 'This is a sample transcript with reasonable length to test wrapping and pagination. It contains multiple sentences and should be displayed properly in the PDF report.',
      translatedTranscript: 'This is a translated version of the transcript that should appear in the English translation section.',
      videoUrl: 'https://proofai.com/video/12345',
      locale: 'en-US'
    }
  },
  {
    name: 'minimal_data',
    data: {
      caseId: 'MINIMAL-123',
      // Missing most fields to test fallbacks
    }
  },
  {
    name: 'long_transcript',
    data: {
      caseId: 'LONG-TEXT-999',
      transcript: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(200), // Long text to test pagination
      translatedTranscript: 'English translation of very long text. '.repeat(100)
    }
  },
  {
    name: 'with_signature',
    data: {
      caseId: 'SIGNATURE-888',
      signatureUrl: 'https://example.com/signatures/john_doe.png', // Test signature image rendering
      transcript: 'Testing signature image rendering with this transcript.'
    }
  },
  {
    name: 'nested_structure',
    data: {
      caseId: 'NESTED-777',
      structuredSummary: {
        address: '456 Oak Lane, Somewhere, TX',
        transcript: 'This transcript is nested in structuredSummary',
        translatedTranscript: 'This translation is nested in structuredSummary',
        rawTranscript: 'Raw text from nested structure',
        participants: [
          { name: 'Robert Johnson', role: 'Manager' }
        ]
      }
    }
  }
];

/**
 * Run PDF generation tests for all test cases
 */
async function runTests() {
  console.log('🧪 Starting PDF Test Harness');
  console.log('Current working directory:', process.cwd());
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'test-output');
  console.log('Creating output directory:', outputDir);
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('Created output directory successfully');
    } else {
      console.log('Output directory already exists');
    }
  } catch (err) {
    console.error('❌ Failed to create output directory:', err);
  }
  
  // Process each test case
  for (const testCase of TEST_CASES) {
    try {
      console.log(`📝 Processing test case: ${testCase.name}`);
      
      // Generate PDF
      const pdfBytes = await generatePDF(testCase.data);
      
      // Save PDF to file
      const outputPath = path.join(outputDir, `${testCase.name}.pdf`);
      fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
      
      console.log(`✅ Test case ${testCase.name} completed. PDF saved to ${outputPath}`);
    } catch (err) {
      console.error(`❌ Test case ${testCase.name} failed:`, err);
    }
  }
  
  console.log('🏁 PDF Test Harness completed');
}

// Export for CLI usage
export { runTests };

// Auto-run if called directly (not imported)
if (require.main === module) {
  runTests().catch(err => {
    console.error('❌ Test harness failed:', err);
    process.exit(1);
  });
}
