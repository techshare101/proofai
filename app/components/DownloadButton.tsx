'use client';

import { Button } from '@/components/ui/button';
import { ReportData } from '@/types';

export function DownloadReportButton({ summaryData }: { summaryData: ReportData }) {
  const handleDownload = async () => {
    try {
      // Validate required fields
      if (!summaryData.summary || !summaryData.transcriptText) {
        console.error('📄 Missing required data:', { summaryData });
        throw new Error('Missing required data for PDF generation');
      }

      // Log the transcript for verification
      console.log('📄 Final transcript to be passed to PDF generation:', summaryData.transcriptText);

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: summaryData })
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
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      // Here you might want to show a toast notification to the user
    }
  };

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
