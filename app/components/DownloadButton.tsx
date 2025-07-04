'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

// Define ReportData interface locally if not exported from types
interface ReportSummary {
  title: string;
  summary: string;
  keyParticipants: string | string[];
  time: string;
  location: string;
  legalRelevance: string;
}

interface ReportData {
  summary: ReportSummary;
  transcriptText: string;
  frameUrl?: string;
  metadata?: {
    userName?: string;
    caseId?: string;
    language?: string;
  };
  language?: string;
}

export function DownloadReportButton({ summaryData }: { summaryData: ReportData }) {
  const handleDownload = async () => {
    try {
      // Validate required fields
      if (!summaryData.summary || !summaryData.transcriptText) {
        console.error('📄 Missing required data:', { summaryData });
        throw new Error('Missing required data for PDF generation');
      }

      // Determine the language - use explicitly set language or detect
      const language = summaryData.language || 
                      summaryData.metadata?.language || 
                      detectLanguage(summaryData.transcriptText);
      
      // Log the transcript and language for verification
      console.log('📄 Final transcript to be passed to PDF generation:', {
        length: summaryData.transcriptText.length,
        language,
        excerpt: summaryData.transcriptText.substring(0, 100) + '...'
      });

      // Format the data according to what the API expects
      const structuredSummary = {
        caseId: summaryData.metadata?.caseId || `case-${Date.now()}`,
        location: summaryData.summary.location || 'Unknown Location',
        participants: summaryData.summary.keyParticipants ? 
          (Array.isArray(summaryData.summary.keyParticipants) ? 
            summaryData.summary.keyParticipants : 
            [summaryData.summary.keyParticipants]) : 
          undefined,
        relevance: summaryData.summary.legalRelevance,
        summaryText: summaryData.summary.summary,
        transcriptText: summaryData.transcriptText,
        timestamp: new Date().toISOString(),
        userId: summaryData.metadata?.userName || 'Unknown',
        generatedBy: 'ProofAI Whisper Bot'
      };
      
      console.log('📄 Sending structured summary to PDF API:', structuredSummary);
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredSummary })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ProofAI_Report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        console.error('PDF Generation Error:', error);
        toast.error('Failed to generate PDF');
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Error downloading report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Helper function to detect language from text
  function detectLanguage(text: string): string {
    if (!text || typeof text !== 'string') return 'Unknown';
    
    // Common Spanish words/patterns to check for
    const spanishPatterns = [
      /\b(?:el|la|los|las|un|una|unos|unas)\b/i,
      /\b(?:y|o|pero|porque|cuando|como|donde|si|no|que)\b/i,
      /\b(?:estar|ser|haber|tener|hacer|ir|venir|decir|ver|dar)\b/i,
      /\b(?:gracias|hola|adiós|buenos días|buenas tardes|buenas noches)\b/i
    ];
    
    // Count Spanish patterns
    const spanishCount = spanishPatterns.reduce((count, pattern) => {
      return count + (pattern.test(text) ? 1 : 0);
    }, 0);
    
    // If multiple Spanish patterns are detected, likely Spanish
    if (spanishCount >= 2) {
      return 'Spanish';
    }
    
    // Default to English for simplicity
    return 'English';
  }

  return (
    <Button 
      onClick={handleDownload}
      className="flex items-center gap-2"
    >
      <span role="img" aria-label="receipt">🧾</span>
      Download Legal Report
    </Button>
  );
}
