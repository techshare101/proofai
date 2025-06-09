import { generatePDF } from '../utils/generatePDF';

const mockData = {
  summary: "This is a test summary of the incident recorded. It includes all key details and a brief analysis.",
  participants: ["John Doe", "Jane Smith", "Witness A"],
  keyEvents: [
    "Event 1: Initial contact",
    "Event 2: Disagreement escalated",
    "Event 3: Supervisor called in",
    "Event 4: Recording ended"
  ],
  context: {
    time: "2025-05-31 14:30",
    location: "Main Office - Floor 2",
    environmentalFactors: "Noisy background, high foot traffic"
  },
  notableQuotes: [
    "John: 'I didn't agree to that.'",
    "Jane: 'This isn't what we discussed earlier.'"
  ],
  reportRelevance: {
    legal: true,
    hr: true,
    safety: false,
    explanation: "Relevant to legal and HR due to dispute nature. No safety violations occurred."
  },
  videoUrl: "https://proofai.app/public/videos/sample123.webm"
};

const mockOptions = {
  caseId: "CASE-TEST-001",
  reviewedBy: "Vodoua QA Bot",
  confidential: true
};

async function run() {
  console.log('Starting PDF generation...');
  try {
    console.log('Input data:', JSON.stringify(mockData, null, 2));
    console.log('Options:', JSON.stringify(mockOptions, null, 2));
    const resultPath = await generatePDF(mockData, mockOptions);
    console.log('✅ PDF generated at:', resultPath);
  } catch (error) {
    console.error('❌ Error generating sample PDF:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
  }
}

run();
