import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import path from 'path';

export interface PDFData {
  summary: string;
  participants?: string[];
  keyEvents?: string[];
  context?: {
    time?: string;
    location?: string;
    environmentalFactors?: string;
  };
  notableQuotes?: string[];
  reportRelevance?: {
    legal?: boolean;
    hr?: boolean;
    safety?: boolean;
    explanation?: string;
  };
  transcript?: string;
  videoUrl?: string;
}

export interface PDFOptions {
  caseId: string;
  reviewedBy?: string;
  confidential?: boolean;
}

const DEFAULT_OPTIONS: PDFOptions = {
  caseId: '',
  reviewedBy: '',
  confidential: false,
};

export async function generatePDF(data: PDFData, options: PDFOptions = DEFAULT_OPTIONS): Promise<string> {
  // Initialize variables with default values
  const {
    summary = '',
    participants = [],
    keyEvents = [],
    context = {
      time: new Date().toLocaleString(),
      location: 'N/A',
      environmentalFactors: 'N/A'
    },
    notableQuotes = [],
    reportRelevance = {
      legal: false,
      hr: false,
      safety: false,
      explanation: 'N/A'
    },
    transcript = '',
    videoUrl = ''
  } = data;

  const {
    caseId,
    reviewedBy = 'ProofAI Whisper Bot',
    confidential = true
  } = options;
  if (!caseId) {
    throw new Error('Case ID is required');
  }

  try {
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });

    const outputPath = path.join(reportsDir, `${caseId}_report.pdf`);
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    }) as PDFKit.PDFDocument;

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Start with title
    doc.fontSize(24).text('PROOF AI INCIDENT REPORT', { align: 'center' });

    // Add space after title
    doc.moveDown();

    if (confidential) {
      doc.fontSize(12).fillColor('red').text('CONFIDENTIAL', { align: 'center' });
      doc.moveDown();
    }

    // Meta Info
    doc.fontSize(12).fillColor('black');
    doc.text(`Case ID: ${caseId}`);
    doc.text(`Reviewed By: ${reviewedBy}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    if (videoUrl) doc.text(`Video URL: ${videoUrl}`);
    doc.moveDown();

    // Section: Summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(summary || transcript || 'No summary or transcript provided.');
    doc.moveDown(2);

    // Section: Context
    doc.fontSize(16).text('Context', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Time: ${context.time || new Date().toLocaleString()}`);
    doc.text(`Location: ${context.location || 'N/A'}`);
    doc.text(`Environment: ${context.environmentalFactors || 'N/A'}`);
    doc.moveDown(2);

    // Section: Participants
    doc.fontSize(16).text('Participants', { underline: true });
    doc.moveDown();
    participants.forEach(p => {
      doc.fontSize(12).text(`• ${p}`, { continued: false });
    });
    doc.moveDown(2);

    // Section: Key Events
    doc.fontSize(16).text('Key Events', { underline: true });
    doc.moveDown();
    keyEvents.forEach(e => {
      doc.fontSize(12).text(`• ${e}`, { continued: false });
    });
    doc.moveDown(2);

    // Section: Witness Transcript
    doc.addPage();
    doc.fontSize(16).fillColor('black').text('Witness Statement', { underline: true });
    doc.moveDown();
    doc.fontSize(14).text('Full Transcript');
    doc.moveDown();

    if (!transcript) {
      doc.fontSize(12).fillColor('red').text('No transcript available.');
    } else {
      // Calculate dimensions for the transcript box
      const margin = 50;
      const width = doc.page.width - (margin * 2);
      const transcriptOptions = {
        width,
        align: 'left' as const,
        lineGap: 8,
      };

      // Draw light blue background
      doc.save();
      const startY = doc.y;
      const height = doc.heightOfString(transcript, transcriptOptions) + 30; // Extra padding
      doc.rect(margin, startY, width, height)
         .fillColor('#f0f7ff')
         .fill();
      doc.restore();

      // Draw transcript text with consistent formatting
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .text(transcript, margin, startY + 15, {
           width: 495,
           align: 'left',
           lineGap: 7
         });
    }
    doc.moveDown(2);

    // Section: Relevance
    doc.fontSize(16).fillColor('black').text('Relevance', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Legal: ${reportRelevance.legal ? 'Yes' : 'No'}`);
    doc.text(`HR: ${reportRelevance.hr ? 'Yes' : 'No'}`);
    doc.text(`Safety: ${reportRelevance.safety ? 'Yes' : 'No'}`);
    doc.text(`Explanation: ${reportRelevance.explanation || 'N/A'}`);

    // Footer
    doc.fontSize(10).fillColor('gray');
    const footerText = `Generated by ProofAI on ${new Date().toLocaleString()}`;
    doc.text(footerText, doc.page.width / 2 - doc.widthOfString(footerText) / 2, doc.page.height - 50);

    // Finalize the PDF
    doc.end();

    // Return the path to the generated PDF
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(`/reports/${caseId}_report.pdf`));
      writeStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
