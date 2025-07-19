import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Generate a minimal PDF to test if basic PDF generation works
 * This is a troubleshooting function to isolate PDF generation issues
 */
export async function generateMinimalPDF() {
  console.log('[PDF-MINIMAL] Starting minimal PDF generation');
  
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    console.log('[PDF-MINIMAL] Drawing text');
    page.drawText('Hello ProofAI!', { 
      x: 50, 
      y: 750, 
      font, 
      size: 24 
    });
    
    console.log('[PDF-MINIMAL] About to save PDF');
    const pdfBytes = await pdfDoc.save();
    console.log('[PDF-MINIMAL] Generated PDF with size:', pdfBytes.length);
    
    return pdfBytes;
  } catch (error) {
    console.error('[PDF-MINIMAL-ERROR] Failed to generate minimal PDF:', error);
    throw new Error(`Minimal PDF generation failed: ${error.message}`);
  }
}
