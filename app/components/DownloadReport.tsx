interface DownloadReportProps {
  pdfPath?: string;
  transcript?: string;
  onGenerateSummaryOnly?: () => void;
  isGenerating?: boolean;
}

export default function DownloadReport({ 
  pdfPath, 
  transcript, 
  onGenerateSummaryOnly,
  isGenerating = false 
}: DownloadReportProps) {
  if (!pdfPath && !onGenerateSummaryOnly) return null;

  // Clean up URL - handle both full URLs and paths
  const cleanPdfUrl = pdfPath
    ? pdfPath.startsWith('http')
      ? pdfPath.replace(/([^:])\/{2,}/g, '$1/') // Clean existing URL
      : `https://fiwtckfmtbcxryhhggsb.supabase.co/storage/v1/object/public/reports/${pdfPath}`.replace(/([^:])\/{2,}/g, '$1/')
    : null;

  // Log for debugging
  if (cleanPdfUrl) {
    console.log('🧾 Original path/URL:', pdfPath);
    console.log('🧾 Final clean download URL:', cleanPdfUrl);
  }

  return (
    <div className="space-y-4">
      {!transcript && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-3">
            🎙️ Transcript is still processing. You can:
          </p>
          <div className="flex gap-3 items-center">
            <button
              onClick={onGenerateSummaryOnly}
              disabled={isGenerating}
              className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm ${
                isGenerating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-900'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating Summary...
                </span>
              ) : (
                'Download Summary-Only Report'
              )}
            </button>
            <span className="text-sm text-gray-600">or check back soon for the full report</span>
          </div>
        </div>
      )}

      {cleanPdfUrl && (
        <button
          onClick={() => {
            if (cleanPdfUrl) {
              console.log('🧾 Opening PDF:', cleanPdfUrl);
              window.open(cleanPdfUrl, '_blank');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
        >
          📥 {transcript ? 'Download Full Report' : 'Download Report'}
        </button>
      )}
    </div>
  );
}
