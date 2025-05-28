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
  try {
    console.log('Generating PDF with params:', params);

    if (!params.summary) {
      throw new Error('Summary is required for PDF generation');
    }

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
    const summaryText = params.summary.trim();
    const lines = doc.splitTextToSize(summaryText, 180); // Slightly narrower for better margins
    doc.text(lines, 15, 45); // Slightly indented

    let yPosition = Math.min(doc.internal.pageSize.height - 60, 45 + (lines.length * 7) + 25);

    // Context Information
    autoTable(doc, {
      head: [['Context Information', 'Details']],
      body: [
        ['Location', params.location || 'Location not available'],
        ['Time', params.time || new Date().toLocaleString()],
        ['Video URL', params.videoUrl || 'URL not available']
      ],
      startY: yPosition,
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 
        0: { cellWidth: 50, fontStyle: 'bold' }, 
        1: { cellWidth: 'auto' } 
      },
      margin: { left: 15 }
    });
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Legal Relevance
    autoTable(doc, {
      head: [['Legal Assessment']],
      body: [
        ['Analysis', params.legalRelevance || 'Legal assessment not available']
      ],
      startY: yPosition,
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 
        0: { cellWidth: 50, fontStyle: 'bold' }, 
        1: { cellWidth: 'auto' } 
      },
      margin: { left: 15 }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | ProofAI Legal Summary | Generated ${new Date().toLocaleString()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const pdfName = `proofai-legal-summary-${Date.now()}.pdf`;
    console.log('Saving PDF as:', pdfName);
    doc.save(pdfName);
    return pdfName;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}
