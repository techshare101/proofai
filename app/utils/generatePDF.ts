import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as fs from 'fs';
import * as path from 'path';

interface PDFData {
  summary: string;
  participants: string[];
  keyEvents: string[];
  context: {
    time: string;
    location: string;
    environmentalFactors: string;
  };
  notableQuotes: string[];
  reportRelevance: {
    legal: boolean;
    hr: boolean;
    safety: boolean;
    explanation: string;
  };
  videoUrl?: string;
}

interface PDFOptions {
  caseId?: string;
  reviewedBy?: string;
  confidential?: boolean;
}

const DEFAULT_OPTIONS: PDFOptions = {
  caseId: '',
  reviewedBy: '',
  confidential: false,
};

export async function generatePDF(data: PDFData, options: PDFOptions = DEFAULT_OPTIONS): Promise<string> {
  try {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 50;
    const lineSpacing = 20;
    let y = margin + 20;

    const addMetadataField = (label: string, value: string) => {
      const fieldHeight = 24;
      doc.setFillColor(247, 250, 252);
      doc.rect(margin - 10, y - 16, pageWidth - (2 * margin) + 20, fieldHeight, 'F');
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(label + ':', margin, y);
      const labelWidth = (doc as any).getStringUnitWidth(label + ': ') * doc.getFontSize();
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + labelWidth, y);
      y += lineSpacing;
    };

    const addSection = (title: string, content: string | string[]) => {
      y += 20;
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }
      doc.setFillColor(44, 62, 80);
      doc.rect(margin - 10, y - 16, pageWidth - (2 * margin) + 20, 32, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(title.toUpperCase(), margin, y);
      y += 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      if (Array.isArray(content)) {
        content.forEach(item => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }
          doc.setFillColor(247, 250, 252);
          doc.rect(margin - 5, y - 12, pageWidth - (2 * margin) + 10, 24, 'F');
          doc.setFont('helvetica', 'bold');
          doc.text('•', margin, y);
          doc.setFont('helvetica', 'normal');
          doc.text(item, margin + 20, y);
          y += lineSpacing;
        });
      } else {
        const maxWidth = pageWidth - (2 * margin) - 10;
        const lines = doc.splitTextToSize(content, maxWidth);
        lines.forEach(line => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineSpacing - 8;
        });
      }
      y += 8;
    };

    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 80, pageWidth, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    const title = 'ProofAI Legal Analysis Report';
    const titleWidth = (doc as any).getStringUnitWidth(title) * doc.getFontSize();
    doc.text(title, (pageWidth - titleWidth) / 2, margin);

    const timestamp = new Date().toLocaleString();
    const caseId = finalOptions.caseId || `IR-${timestamp.split(',')[0].replace(/\//g, '')}`;
    addMetadataField('Case ID', caseId);
    addMetadataField('Time', timestamp);
    if (data.context?.location) addMetadataField('Location', data.context.location);
    if (data.videoUrl) addMetadataField('Video Reference', data.videoUrl);

    if (finalOptions.confidential) {
      doc.setFillColor(253, 235, 235);
      doc.rect(margin - 5, y - 5, pageWidth - (2 * margin) + 10, 22, 'F');
      doc.setTextColor(180, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIDENTIAL - For authorized personnel only', margin, y + 8);
      y += lineSpacing + 10;
    }

    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineSpacing;

    // Add sections with fallbacks
    addSection('Main Summary', data.summary || 'No summary provided.');
    addSection('Participants', data.participants || ['No participants listed']);
    addSection('Key Events', data.keyEvents || ['No key events recorded']);
    const context = data.context || {
      time: new Date().toLocaleString(),
      location: 'Unknown',
      environmentalFactors: 'Unknown'
    };
    addSection('Context', [
      `Time: ${context.time}`,
      `Location: ${context.location}`,
      `Environmental Factors: ${context.environmentalFactors}`
    ]);
    // Add section break before transcript
    y += lineSpacing;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineSpacing * 2;

    // Add new page for transcript to prevent overlap
    doc.addPage();
    y = margin;

    // Transcript section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('👤 Witness Name: Kojo', margin, y);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 150, y + 2); // Underline
    y += lineSpacing * 2;

    doc.setFont('helvetica', 'bold');
    doc.text('📜 Transcript:', margin, y);
    y += lineSpacing * 1.5;

    // Transcript content with light blue background
    doc.setFillColor(240, 247, 255);
    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Get transcript from notableQuotes
    const transcriptText = data.notableQuotes?.[1] || 'No transcript available';
    
    // Calculate text height and add background
    const splitText = doc.splitTextToSize(transcriptText, pageWidth - (margin * 2));
    const textHeight = splitText.length * 14; // Approximate height per line
    
    doc.rect(margin - 10, y - 10, pageWidth - (margin * 2) + 20, textHeight + 20, 'F');
    
    // Add text with proper line spacing
    splitText.forEach(line => {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14; // Line height
    });
    
    y += lineSpacing * 2;
    
    // Add section break after transcript
    doc.setDrawColor(200, 200, 200);
    doc.text('──────────────────────────────', pageWidth / 2, y, { align: 'center' });
    y += lineSpacing * 2;
    const relevance = data.reportRelevance || {
      legal: false,
      hr: false,
      safety: false,
      explanation: 'No relevance data provided'
    };
    addSection('Legal, HR & Safety Relevance', [
      `Legal: ${relevance.legal ? '✔️ Yes' : '❌ No'}`,
      `HR: ${relevance.hr ? '✔️ Yes' : '❌ No'}`,
      `Safety: ${relevance.safety ? '✔️ Yes' : '❌ No'}`,
      `Explanation: ${relevance.explanation}`
    ]);

    y = Math.min(y + 20, pageHeight - 60);
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineSpacing;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Prepared by:', margin, y);
    y += lineSpacing;
    doc.setTextColor(44, 62, 80);
    doc.text(finalOptions.reviewedBy || 'ProofAI Legal Assistant', margin, y);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(44, 62, 80);
      doc.rect(0, pageHeight - 50, pageWidth, 50, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Generated by ProofAI', margin, pageHeight - 25);
      doc.setFont('helvetica', 'normal');
      doc.text('www.proofai.app', margin, pageHeight - 12);
      const pageText = `Page ${i} of ${totalPages}`;
      const pageTextWidth = (doc as any).getStringUnitWidth(pageText) * doc.getFontSize();
      const pageNumX = pageWidth - margin - pageTextWidth;
      doc.setFillColor(52, 152, 219);
      doc.rect(pageNumX - 10, pageHeight - 35, pageTextWidth + 20, 25, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(pageText, pageNumX, pageHeight - 20);
    }

    const filename = `${caseId}_report.pdf`;
    const reportsDir = path.join(process.cwd(), 'public/reports');
    const savePath = path.join(reportsDir, filename);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    fs.writeFileSync(savePath, Buffer.from(doc.output('arraybuffer')));
    return `/reports/${filename}`;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}
