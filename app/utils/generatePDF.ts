// ProofAI PDF Generation Utility
// Enhanced with the new polished PDF generation capabilities

import { StructuredSummary, PdfGenerationOptions } from '../types/pdf';
import { generatePolishedPDF } from './pdfPolish';
import { formatSummary } from './formatSummary';

interface PdfRequest {
  content: string;
  caseId: string;
  generatedBy?: string;
  options: PdfGenerationOptions;
  structuredSummary?: StructuredSummary;
}

// Default options for PDF generation
const DEFAULT_OPTIONS: PdfGenerationOptions = {
  watermark: false,
  confidential: true,
  includeSignature: true,
  includeTimestamps: true,
  includeFooter: true
};

/**
 * Legacy wrapper for generatePDF that uses the new polished PDF generator
 * This maintains backward compatibility while leveraging the enhanced PDF generation
 * @param request The PDF request containing necessary data
 * @returns PDF as Uint8Array
 */
export async function generatePDF(request: PdfRequest): Promise<Uint8Array> {
  const { options = DEFAULT_OPTIONS, caseId, structuredSummary } = request;
  
  try {
    // For content, use the outer content if no structured summary
    const fullContent = request.content || '';
    
    // Get the structured summary data
    // Always prioritize the structured summary for the report summary section
    const structuredSummaryText = structuredSummary?.summary || '';
    
    // For transcript, use what's available
    const transcript = structuredSummary?.transcript || '';
    // Keep the original Spanish transcript separate
    const cleanedOriginal = structuredSummary?.originalTranscript || '';
    // Get language info - use provided language or detect based on transcript
    const language = structuredSummary?.language || 
                    (cleanedOriginal && cleanedOriginal.length > 0 ? 'Spanish' : 'English');
    
    // Debug the transcript and language data
    console.log('[generatePDF] Transcript data:', {
      transcriptLength: transcript.length,
      originalTranscriptLength: cleanedOriginal.length,
      language,
      transcriptExcerpt: transcript.substring(0, 50) + '...',
      originalExcerpt: cleanedOriginal.substring(0, 50) + '...'
    });
    
    // Extract location from structured summary content if it contains a line with "📍 Location:" prefix
    let location = 'Unknown Location';
    
    // First try to get location from structuredSummary.summary (the structured content)
    if (structuredSummaryText && structuredSummaryText.includes('📍 Location:')) {
      // Look for the line with geocoded location info
      const lines = structuredSummaryText.split('\n');
      const locationLine = lines.find(line => line.trim().startsWith('📍 Location:'));
      
      if (locationLine) {
        // Extract the part after "📍 Location:" as the clean location
        location = locationLine.substring(locationLine.indexOf('📍 Location:') + '📍 Location:'.length).trim();
        console.log(`🌍 generatePDF extracted location from structured summary: ${location}`);
      }
    }
    
    // Fall back to manually overridden location if available
    if (location === 'Unknown Location' && structuredSummary?.location) {
      location = structuredSummary.location;
      console.log(`🌍 generatePDF using manually overridden location: ${location}`);
    }
    
    // If we have latitude and longitude but no human-readable location, try to geocode it
    if ((location === 'Unknown Location' || location.startsWith('Lat:')) && 
        structuredSummary?.lat !== undefined && 
        structuredSummary?.lng !== undefined) {
      try {
        const { getAddressFromCoordinates } = await import('./geocodeAddress');
        const geocodedAddress = await getAddressFromCoordinates(
          structuredSummary.lat,
          structuredSummary.lng
        );
        
        // Only use geocoded address if it's not in the lat/lng format
        if (geocodedAddress && !geocodedAddress.startsWith('Lat:')) {
          location = geocodedAddress;
          console.log(`🌍 generatePDF using geocoded location: ${location}`);
        }
      } catch (error) {
        console.error('Error geocoding coordinates:', error);
      }
    }
    
    const videoUrl = structuredSummary?.videoUrl || 'https://proof.ai/evidence';
    const reportDate = structuredSummary?.reportDate || new Date().toLocaleDateString();
    const participants = structuredSummary?.participants || [];
    
    // Determine legal relevance text based on reportRelevance object
    let legalRelevance = 'Not specified';
    if (structuredSummary?.reportRelevance?.legal === true) {
      legalRelevance = 'Legally relevant';
    } else if (structuredSummary?.reportRelevance?.legal === false) {
      legalRelevance = 'Not legally relevant';
    }
    
    // Determine the reportPublicUrl (if available) for verification QR code
    const reportPublicUrl = structuredSummary?.publicUrl || '';
    
    // Generate polished PDF using the new utility
    const pdfBlob = await generatePolishedPDF({
      // Pass both the structured summary text and the overall content
      // This ensures the structured summary is rendered in the "REPORT SUMMARY" section
      summary: {
        text: fullContent,               // The original unstructured content
        structuredSummaryText: structuredSummaryText  // The structured summary content
      },
      // Required property for PDF content - use transcript or fullContent
      content: transcript || fullContent,
      transcript,
      original_transcript: cleanedOriginal, // Pass the original Spanish transcript
      language, // Explicitly pass the language parameter for correct labeling
      location,
      videoUrl,
      caseId: caseId || structuredSummary?.caseId || 'Unspecified',
      reportDate,
      participants,
      // Pass both relevance options to ensure compatibility
      relevance: legalRelevance,
      legalRelevance,
      includeSignature: options.includeSignature,
      reportPublicUrl: reportPublicUrl
    });
    
    // Convert Blob to Uint8Array for compatibility with existing code
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    return pdfBytes;
  } catch (error) {
    console.error('Polished PDF generation error:', error);
    throw error;
  }
}
