import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SummaryData {
  summary: {
    title: string;
    summary: string;
    keyParticipants: string;
    time: string;
    location: string;
    legalRelevance: string;
  };
  transcriptText: string;
  frameUrl?: string;
  metadata?: {
    caseId?: string;
    userName?: string;
  };
}

export class PDFService {
  private static formatText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  public static generateSummaryPDF(data: SummaryData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    const margin = 20;
    const lineHeight = 7;

    // Header with Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.summary.title, margin, yPos);
    yPos += lineHeight * 2;

    // Metadata Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const metadata = [
      ['Time:', data.summary.time],
      ['Location:', data.summary.location],
      ['Key Participants:', data.summary.keyParticipants],
      ...(data.metadata?.caseId ? [['Case ID:', data.metadata.caseId]] : []),
      ...(data.metadata?.userName ? [['Reported By:', data.metadata.userName]] : [])
    ];

    metadata.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 25, yPos);
      yPos += lineHeight;
    });

    yPos += lineHeight;

    yPos += lineHeight;

    // Summary Section
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', margin, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    const summaryLines = this.formatText(data.summary.summary, 75);
    summaryLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    yPos += lineHeight;

    // Legal Relevance Section
    doc.setFont('helvetica', 'bold');
    doc.text('Legal Relevance:', margin, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    const legalLines = this.formatText(data.summary.legalRelevance, 75);
    legalLines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    yPos += lineHeight;

    // Transcript Section
    doc.setFont('helvetica', 'bold');
    doc.text('Original Transcript:', margin, yPos);
    yPos += lineHeight;

    doc.setFont('helvetica', 'normal');
    const transcriptLines = this.formatText(data.transcriptText, 75);
    transcriptLines.forEach(line => {
      if (yPos >= doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPos = margin + lineHeight;
      }
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // Frame Image
    if (data.frameUrl) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.text('Video Frame Reference:', margin, margin);
      // Note: In a real implementation, you'd need to handle the image loading
      // and conversion. For now, we'll just add a placeholder note.
      doc.setFont('helvetica', 'normal');
      doc.text('Frame URL: ' + data.frameUrl, margin, margin + lineHeight);
    }

    // Signature Section
    doc.addPage();
    yPos = margin;
    doc.setFont('helvetica', 'bold');
    doc.text('Verification', margin, yPos);
    yPos += lineHeight * 2;

    doc.setFont('helvetica', 'normal');
    doc.text('Signature: _______________________', margin, yPos);
    yPos += lineHeight * 2;
    doc.text('Date: _________________________', margin, yPos);
    yPos += lineHeight * 2;
    doc.text('Name (Print): ___________________', margin, yPos);

    // Save the PDF
    doc.save('ProofAI_Summary.pdf');
  }
}
