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

export function generateSummaryPDF(summary: SummaryResult): string {
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
  doc.text(summary.summary, 10, 45, { maxWidth: 190 });

  let yPosition = 70;

  // Participants
  if (summary.participants?.length) {
    autoTable(doc, {
      head: [['Involved Parties']],
      body: summary.participants.map(p => [p]),
      startY: yPosition
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Key Events
  if (summary.keyEvents?.length) {
    autoTable(doc, {
      head: [['Chronological Events']],
      body: summary.keyEvents.map(e => [e]),
      startY: yPosition
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Context
  if (summary.context) {
    autoTable(doc, {
      head: [['Contextual Information']],
      body: [
        ['Location', summary.context.location || 'Not specified'],
        ['Time', summary.context.time || 'Not specified'],
        ['Environmental Factors', summary.context.environmentalFactors || 'None noted']
      ],
      startY: yPosition
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notable Quotes
  if (summary.notableQuotes?.length) {
    autoTable(doc, {
      head: [['Notable Quotes']],
      body: summary.notableQuotes.map(q => [q]),
      startY: yPosition
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Legal Relevance
  if (summary.reportRelevance) {
    autoTable(doc, {
      head: [['Report Relevance Assessment']],
      body: [
        ['Legal Relevance', summary.reportRelevance.legal ? 'Yes' : 'No'],
        ['HR Relevance', summary.reportRelevance.hr ? 'Yes' : 'No'],
        ['Safety Relevance', summary.reportRelevance.safety ? 'Yes' : 'No'],
        ['Explanation', summary.reportRelevance.explanation]
      ],
      startY: yPosition
    });
  }

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
