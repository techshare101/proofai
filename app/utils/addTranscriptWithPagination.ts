import jsPDF from "jspdf";

export function addTranscriptWithPagination(doc: jsPDF, transcript: string, startY = 70) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 8;
  const maxY = pageHeight - margin - 20;
  let y = startY;
  let pageNum = doc.getNumberOfPages();
  let transcriptStarted = false;
  let firstTranscriptPage = true;

  function addPageNumber(page: number, total: number) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Page ${page} of ${total}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  // Prepare all transcript lines, word-wrapped for the page width
  const allLines: string[] = [];
  for (const para of transcript.split("\n")) {
    const wrapped = doc.splitTextToSize(para, pageWidth - 2 * margin);
    allLines.push(...wrapped);
  }

  for (let i = 0; i < allLines.length; i++) {
    if (!transcriptStarted || y + lineHeight > maxY) {
      if (!firstTranscriptPage) {
        addPageNumber(pageNum, 0); // Placeholder
        doc.addPage();
        pageNum++;
        y = margin + 10;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Transcript:", margin, y);
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      transcriptStarted = true;
      firstTranscriptPage = false;
    }
    doc.text(allLines[i], margin, y);
    y += lineHeight;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageNumber(i, totalPages);
  }
}
