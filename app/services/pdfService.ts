import { generatePDF } from '../utils/generatePDF';
import { StructuredSummary, PdfGenerationOptions, PdfGenerationRequest } from '../types/pdf';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAddressFromCoordinates } from '../utils/geocodeAddress';



export class PDFService {
  private static instance: PDFService;
  private supabase: SupabaseClient;

  private constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public static async getInstance(supabase: SupabaseClient): Promise<PDFService> {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService(supabase);
    }
    return PDFService.instance;
  }

  public async generatePDFReport(summary: StructuredSummary, options: PdfGenerationOptions = {
    watermark: false,
    confidential: true,
    includeSignature: true,
    includeTimestamps: true
  }): Promise<string> {
    try {
      // If lat and lng are available, use reverse geocoding to get a more accurate location
      if (summary.lat && summary.lng) {
        try {
          console.log(`🌎 Requesting reverse geocoding for: ${summary.lat}, ${summary.lng}`);
          const address = await getAddressFromCoordinates(summary.lat, summary.lng);
          
          // Update location only if geocoding was successful
          if (address && address.trim() !== '') {
            // Directly modify the location property so it's updated throughout the reference chain
            summary.location = address;
            console.log(`🌎 Location updated to: ${address}`);
          }
        } catch (geoError) {
          console.error(`❌ Reverse geocoding failed: ${geoError instanceof Error ? geoError.message : 'Unknown error'}`);
          // Geocoding failed, we'll use the default location value
        }
      }

      // Create the PDF generation request
      // Note: PdfRequest expects 'content' property which we'll set to summary.summary
      const request = {
        content: summary.summary || '',  // Required by PdfRequest interface
        caseId: summary.caseId,
        structuredSummary: summary,
        options: options
      };

      // Log the location being sent to PDF generator
      console.log(`[PDF API] 🌎 Location being sent to PDF generator: ${summary.location || 'Not available'}`);
      
      // Generate the PDF using the utility
      const pdfBuffer = await generatePDF(request);

      // Upload PDF to Supabase storage
      const filename = `${summary.caseId}_report.pdf`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('reports')
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      // Get signed URL for the PDF
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from('reports')
        .createSignedUrl(uploadData.path, 3600); // 1 hour expiry

      if (urlError || !urlData?.signedUrl) {
        throw new Error(`Failed to generate download URL: ${urlError?.message}`);
      }

      // Return the signed URL
      return urlData.signedUrl;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
