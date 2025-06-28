import Link from "next/link";

export default function ReportCard({ report }: { report: any }) {
  return (
    <div className="border rounded p-4 shadow hover:bg-gray-50 transition">
      <h3 className="font-semibold text-lg">{report.title}</h3>
      <p className="text-gray-500 text-sm">{report.summary}</p>
      <Link href={report.report_url} className="text-blue-600 text-sm mt-2 inline-block">
        View PDF
      </Link>
    </div>
  );
}
