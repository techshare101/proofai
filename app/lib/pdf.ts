import jsPDF from 'jspdf';

interface SummaryPDFOptions {
  summary: string;
  location: string;
  time: string;
  videoUrl: string;
  legalRelevance: string;
  transcript: string;
}

export function generateSummaryPDF({
  summary,
  location,
  time,
  videoUrl,
  legalRelevance,
  transcript,
}: SummaryPDFOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 8;
  const maxY = pageHeight - margin - 20;
  let y = 20;

  function addPageNumber(page: number, total: number) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Page ${page} of ${total}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  function addHeaderWatermark() {
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text("ProofAI — Instant Evidence Builder", pageWidth / 2, 10, { align: "center" });
  }

  let pageNum = 1;
  addHeaderWatermark();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text('📄 ProofAI Legal Summary Report', margin, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`🕒 Time: ${time}`, margin, y);
  y += 8;
  doc.text(`📍 Location: ${location}`, margin, y);
  y += 8;
  doc.text(`🎥 Video URL: ${videoUrl}`, margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text('📝 Summary:', margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(summary, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * lineHeight;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text('⚖️ Legal Relevance:', margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const legalLines = doc.splitTextToSize(legalRelevance, pageWidth - 2 * margin);
  doc.text(legalLines, margin, y);
  y += legalLines.length * lineHeight + 10;

  // --- Robust Transcript Pagination ---
  const allLines: string[] = [];
  for (const para of transcript.split("\n")) {
    const wrapped = doc.splitTextToSize(para, pageWidth - 2 * margin);
    allLines.push(...wrapped);
  }

  let transcriptStarted = false;
  let firstTranscriptPage = true;
  for (let i = 0; i < allLines.length; i++) {
    if (!transcriptStarted || y + lineHeight > maxY) {
      if (!firstTranscriptPage) {
        addPageNumber(pageNum, 0); // temp
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 15);
        doc.addPage();
        pageNum++;
        y = 20;
        addHeaderWatermark();
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Transcript:", margin, y);
      y += lineHeight;
      transcriptStarted = true;
      firstTranscriptPage = false;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(allLines[i], margin, y);
    y += lineHeight;
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageNumber(i, totalPages);
  }

  const fileName = `proofai-legal-summary-${Date.now()}.pdf`;
  doc.save(fileName);
}
