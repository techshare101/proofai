// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/utils/generatePDF';

export async function POST(req: NextRequest) {
  try {
    const { data, options } = await req.json();

    // fallback-safe default values
    const safeData = {
      summary: data.summary || 'No summary provided.',
      participants: data.participants || ['N/A'],
      keyEvents: data.keyEvents || ['N/A'],
      context: data.context || {
        time: new Date().toISOString(),
        location: 'Unknown',
        environmentalFactors: 'Unknown',
      },
      notableQuotes: data.notableQuotes || ['No quotes provided.'],
      reportRelevance: data.reportRelevance || {
        legal: false,
        hr: false,
        safety: false,
        explanation: 'No explanation provided.',
      },
      transcript: data.transcript || 'No transcript available.',
      videoUrl: data.videoUrl || '',
    };

    const pdfPath = await generatePDF(safeData, options);
    return NextResponse.json({ success: true, path: pdfPath });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    const errorMessage = error.message.includes('ENOENT') && error.message.includes('.afm')
      ? 'Font configuration error. Please check server configuration.'
      : error.message;
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
