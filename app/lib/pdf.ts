import jsPDF from 'jspdf';

interface SummaryPDFOptions {
  summary: string;
  location: string;
  time: string;
  videoUrl: string;
  legalRelevance: string;
}

export function generateSummaryPDF({
  summary,
  location,
  time,
  videoUrl,
  legalRelevance,
}: SummaryPDFOptions) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text('📄 ProofAI Legal Summary Report', 20, 20);

  doc.setFontSize(11);
  doc.text(`🕒 Time: ${time}`, 20, 30);
  doc.text(`📍 Location: 221 27th Ave N, Myrtle Beach, SC 29577, USA`, 20, 40);
  doc.text(`🎥 Video URL: ${videoUrl}`, 20, 50);

  doc.setFontSize(12);
  doc.text('📝 Summary:', 20, 70);
  doc.text(doc.splitTextToSize(summary, 160), 20, 80);

  doc.setFontSize(12);
  doc.text('⚖️ Legal Relevance:', 20, 130);
  doc.text(doc.splitTextToSize(legalRelevance, 160), 20, 140);

  const fileName = `proofai-legal-summary-${Date.now()}.pdf`;
  doc.save(fileName);
}
