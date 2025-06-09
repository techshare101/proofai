const http = require('http');

const data = {
  data: {
    summary: "Test incident report",
    transcript: "This is a sample transcript for testing the PDF generation. The text should appear on a new page with a light blue background. The transcript should be clearly visible and properly formatted.",
    participants: ["John Doe", "Jane Smith"],
    keyEvents: ["Event 1", "Event 2"],
    context: {
      time: new Date().toISOString(),
      location: "Meeting Room A",
      environmentalFactors: "Normal office conditions"
    },
    reportRelevance: {
      legal: true,
      hr: true,
      safety: false,
      explanation: "Incident requires HR review"
    }
  },
  options: {
    caseId: `TEST-${Date.now()}`,
    reviewedBy: "Test User",
    confidential: true
  }
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-pdf',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Sending request to generate PDF...');
console.log('Request data:', JSON.stringify(data, null, 2));

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);

  let responseData = '';
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    console.log('Response body:', responseData);
    try {
      const result = JSON.parse(responseData);
      if (result.success) {
        console.log('PDF generated successfully!');
        console.log('PDF path:', result.path);
      } else {
        console.error('Failed to generate PDF:', result.error);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (error) => {
  console.error('Connection error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('Make sure the Next.js server is running on port 3000');
  }
});

req.write(JSON.stringify(data));
req.end();

console.log('Request sent, waiting for response...');
