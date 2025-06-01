'use client';

import { generatePDF } from '@/utils/generatePDF';
import { Button } from '@/components/ui/button';
import { SummaryResult } from '@/types';

export function DownloadReportButton({ summaryData }: { summaryData: SummaryResult }) {
  return (
    <Button 
      onClick={() => generatePDF(summaryData)}
      className="flex items-center gap-2"
    >
      <span role="img" aria-label="receipt">🧾</span>
      Download Legal Report
    </Button>
  );
}
