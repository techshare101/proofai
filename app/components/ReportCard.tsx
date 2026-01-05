export default function ReportCard({ report }: { report: any }) {
  return (
    <div className="border rounded p-4 shadow hover:bg-gray-50 transition">
      <h3 className="font-semibold text-lg">{report.title}</h3>
      <p className="text-gray-500 text-sm">{report.summary}</p>
      <a 
        href={report.pdf_url || report.report_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 text-sm mt-2 inline-block hover:underline"
      >
        View PDF
      </a>
    </div>
  );
}
