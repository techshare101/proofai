import { StructuredSummary } from '../types/pdf';

export interface PdfGenerationOptions {
  watermark?: boolean;
  confidential?: boolean;
  includeSignature?: boolean;
  includeTimestamps?: boolean;
  includeFooter?: boolean;
}

function formatSummary(summary: StructuredSummary): string {
  if (!summary || typeof summary !== 'object' || typeof summary.summary !== 'string') {
    return 'Summary not available. Please re-upload your recording.';
  }

  const header = [
    'PROOF AI INCIDENT REPORT',
    `Case ID: ${summary.caseId || 'N/A'}`,
    `Report Date: ${summary.reportDate ? new Date(summary.reportDate).toLocaleString() : 'N/A'}`,
    `Location: ${summary.location || 'N/A'}`,
    'Reviewed By: ProofAI Whisper Bot',
    ''
  ];

  const body: string[] = [];

  body.push('Summary:');
  body.push(summary.summary.trim() ? `  ${summary.summary}` : '  (No summary content)');
  body.push('');

  if (Array.isArray(summary.participants) && summary.participants.length > 0) {
    body.push('Participants:');
    summary.participants.forEach(p => body.push(`  • ${p}`));
    body.push('');
  }

  if (Array.isArray(summary.timestampedLog) && summary.timestampedLog.length > 0) {
    body.push('Timestamped Log:');
    summary.timestampedLog.forEach(log => body.push(`  • ${log}`));
    body.push('');
  }

  if (Array.isArray(summary.actionItems) && summary.actionItems.length > 0) {
    body.push('Action Items:');
    summary.actionItems.forEach(item => body.push(`  • ${item}`));
    body.push('');
  }

  if (summary.reportRelevance && typeof summary.reportRelevance === 'object') {
    const tags = Object.entries(summary.reportRelevance)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(', ');
    if (tags) {
      body.push(`Report Relevance: ${tags}`);
      body.push('');
    }
  }

  if (summary.incidentDetails) {
    body.push('Incident Details:');
    body.push(`  ${summary.incidentDetails}`);
    body.push('');
  }

  const result = [...header, ...body].join('\n');
  return !result.trim() || result.includes('[object Object]')
    ? 'Summary not available. Please re-upload your recording.'
    : result;
}


export class ClientPDFService {
  public static async generatePDFReport(
    summary: StructuredSummary,
    options: PdfGenerationOptions = {
      watermark: false,
      confidential: true,
      includeSignature: true,
      includeTimestamps: true,
      includeFooter: true
    },
    userId?: string
  ): Promise<string> {
    let response;
    try {
      console.log('📊 PDF Generation Request - Input Summary:', {
        caseId: summary?.caseId || 'Missing',
        hasVideoUrl: !!summary?.videoUrl,
        videoUrlLength: summary?.videoUrl?.length || 0,
        summaryLength: typeof summary?.summary === 'string' ? summary.summary.length : 'Not a string',
        userId: userId ? `${userId.substring(0,8)}...` : 'No user ID provided'
      });
      
      const formattedSummary = formatSummary(summary);

      // Make sure we have a valid videoUrl
      if (!summary.videoUrl) {
        console.warn('⚠️ No videoUrl provided in summary, using default URL');
        summary.videoUrl = `https://proofai.app/view/${summary.caseId || 'unknown'}`;
      } else {
        console.log('✅ Using provided videoUrl:', summary.videoUrl);
      }
      
      // Include userId if available to enable Supabase storage upload
      console.log('🌐 Sending PDF generation request to API');
      // Get transcript values with fallbacks
      const transcript = summary.transcript || '';
      const originalTranscript = summary.originalTranscript || transcript;
      const rawTranscript = summary.rawTranscript || originalTranscript;
      const translatedTranscript = summary.translatedTranscript || summary.summary || '';
      
      console.log('📝 Transcript data for PDF:', {
        transcriptLength: transcript.length,
        originalTranscriptLength: originalTranscript.length,
        rawTranscriptLength: rawTranscript.length,
        translatedTranscriptLength: translatedTranscript.length
      });

      response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Top-level transcript fields (critical for backward compatibility)
          transcript,
          originalTranscript,
          rawTranscript,
          translatedTranscript,
          
          // Structured summary with all transcript fields
          structuredSummary: {
            ...summary,
            // Ensure all transcript fields are included in the summary
            transcript,
            originalTranscript,
            rawTranscript,
            translatedTranscript,
            summary: formattedSummary, // Use the formatted summary
            // Ensure videoUrl is included in the structured summary
            videoUrl: summary.videoUrl,
          },
          
          // Other required fields
          formattedSummary,
          options,
          userId,
          uploadToSupabase: !!userId,
          videoUrl: summary.videoUrl,
          caseId: summary.caseId,
        }),
      });
    } catch (fetchError) {
      console.error('❌ Error making PDF API request:', fetchError);
      throw new Error(`Failed to connect to PDF generation service: ${fetchError.message}`);
    }

    if (!response.ok) {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Failed to generate PDF');
      } catch {
        throw new Error(`PDF generation failed with status ${response.status}`);
      }
    }

    // Handle direct PDF response instead of JSON
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/pdf')) {
      // For direct PDF response, create an object URL and return it
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      return pdfUrl;
    } else {
      // Fallback to previous behavior for backward compatibility
      try {
        const result = await response.json();
        
        // If we have a publicUrl from Supabase upload, return that
        if (result.success && result.publicUrl) {
          console.log('[ClientPDFService] PDF uploaded to Supabase:', result.publicUrl);
          return result.publicUrl;
        }
        
        // Fall back to the previous URL format if available
        const cleanUrl = result.url?.replace(/([^:])\/\{2,\}/g, '$1/');
        return cleanUrl;
      } catch (error) {
        console.error('Failed to parse response as JSON:', error);
        throw new Error('Invalid response format from PDF generation service');
      }
    }
  }
}
