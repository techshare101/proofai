interface DownloadReportProps {
  pdfPath?: string;
}

export function DownloadReport({ pdfPath }: DownloadReportProps) {
  if (!pdfPath) return null;

  return (
    <button 
      onClick={() => window.open(pdfPath)} 
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
    >
      📥 Download Report
    </button>
  );
}
