import { writeFileSync } from 'fs';
import { generatePDF } from '../app/utils/generatePDF';

// Sample data that matches the expected input format
const testData = {
  caseId: 'CASE-2023-001',
  reportDate: new Date().toISOString(),
  location: '123 Main St, Anytown, USA',
  translatedTranscript: `This is a test of the English translation section. It contains sample text to demonstrate how the PDF generation handles multiple lines of text.

Each paragraph should be properly spaced, and the text should wrap cleanly within the page margins. The PDF generator should handle line breaks and paragraph breaks appropriately.

This section tests the English translation capabilities of the system. The text should be clear and readable, with proper formatting and spacing.`,
  originalTranscript: `Esta es una prueba de la sección de transcripción original. Contiene texto de muestra para demostrar cómo la generación de PDF maneja múltiples líneas de texto en el idioma original.

Cada párrafo debe estar correctamente espaciado, y el texto debe ajustarse correctamente dentro de los márgenes de la página. El generador de PDF debe manejar los saltos de línea y los saltos de párrafo de manera adecuada.

Esta sección prueba las capacidades de transcripción del sistema. El texto debe ser claro y legible, con formato y espaciado adecuados.`,
  videoUrl: 'https://example.com/video/12345',
  structuredSummary: {
    caseId: 'CASE-2023-001',
    location: '123 Main St, Anytown, USA',
    translatedTranscript: `This is a test of the English translation section. It contains sample text to demonstrate how the PDF generation handles multiple lines of text.

Each paragraph should be properly spaced, and the text should wrap cleanly within the page margins. The PDF generator should handle line breaks and paragraph breaks appropriately.

This section tests the English translation capabilities of the system. The text should be clear and readable, with proper formatting and spacing.`,
    originalTranscript: `Esta es una prueba de la sección de transcripción original. Contiene texto de muestra para demostrar cómo la generación de PDF maneja múltiples líneas de texto en el idioma original.

Cada párrafo debe estar correctamente espaciado, y el texto debe ajustarse correctamente dentro de los márgenes de la página. El generador de PDF debe manejar los saltos de línea y los saltos de párrafo de manera adecuada.

Esta sección prueba las capacidades de transcripción del sistema. El texto debe ser claro y legible, con formato y espaciado adecuados.`
  }
};

async function testPdfGeneration() {
  try {
    console.log('Starting PDF generation test...');
    
    // Generate the PDF
    const pdfBytes = await generatePDF(testData);
    
    // Save to file
    const outputPath = './test-output.pdf';
    writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF generated successfully at: ${outputPath}`);
    console.log('PDF size:', (pdfBytes.length / 1024).toFixed(2), 'KB');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

testPdfGeneration();
