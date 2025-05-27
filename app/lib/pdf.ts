import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
import { SummaryResult } from '../types';

interface GeneratePDFParams {
  summary: string;
  location: string;
  time: string;
  videoUrl: string;
  legalRelevance: string;
}

export function generateSummaryPDF(params: GeneratePDFParams): string {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('ProofAI Legal Summary Report', 10, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 22);

  // Main Summary
  doc.setFontSize(14);
  doc.text('Event Summary:', 10, 35);
  doc.setFontSize(12);
  doc.text(params.summary, 10, 45, { maxWidth: 190 });

  let yPosition = 70;

  // Context Information
  autoTable(doc, {
    head: [['Contextual Information']],
    body: [
      ['Location', params.location],
      ['Time', params.time],
      ['Video URL', params.videoUrl]
    ],
    startY: yPosition
  });
  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Legal Relevance
  autoTable(doc, {
    head: [['Legal Assessment']],
    body: [
      ['Legal Relevance', params.legalRelevance]
    ],
    startY: yPosition
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${pageCount} | ProofAI Legal Summary`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfName = `proofai-legal-summary-${Date.now()}.pdf`;
  doc.save(pdfName);
  return pdfName;
}
