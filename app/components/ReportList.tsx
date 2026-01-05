'use client';
import { useEffect, useState } from 'react';
import { fetchReportsByFolder } from '../../supabase/fetchReportsByFolder';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportList({ folderId }: { folderId: string }) {
  const { session } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folderId || !session?.user) return;
    fetchReportsByFolder(folderId, session.user.id)
      .then(setReports)
      .finally(() => setLoading(false));
  }, [folderId, session]);

  if (loading) return <p>Loading reports...</p>;
  if (!reports.length) return <p>No reports in this folder yet.</p>;

  return (
    <div className="space-y-3">
      {reports.map((report: any) => (
        <div key={report.id} className="border rounded p-4 shadow-sm">
          <h3 className="font-bold text-lg">{report.title}</h3>
          <p className="text-sm text-gray-600">{report.summary}</p>
          <a
            href={report.pdf_url || report.report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm"
          >
            View PDF
          </a>
        </div>
      ))}
    </div>
  );
}
