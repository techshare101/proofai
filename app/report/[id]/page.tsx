import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ReportPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      id,
      title,
      created_at,
      location,
      pdf_url,
      file_url,
      summary,
      folders(name)
    `)
    .eq('id', params.id)
    .single()

  if (error || !report) {
    notFound()
  }

  // Extract summary text from JSONB
  let summaryText = 'No summary available'
  if (report.summary) {
    if (typeof report.summary === 'object') {
      summaryText = (report.summary as any).summary || (report.summary as any).text || 'No summary available'
    } else if (typeof report.summary === 'string') {
      try {
        const parsed = JSON.parse(report.summary)
        summaryText = parsed.summary || parsed.text || report.summary
      } catch {
        summaryText = report.summary
      }
    }
  }

  // Get folder name
  const folderName = Array.isArray(report.folders) && report.folders.length > 0
    ? (report.folders[0] as any)?.name
    : (report.folders as any)?.name || 'Uncategorized'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          <h1 className="text-2xl font-semibold text-gray-900">{report.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(report.created_at).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
            {report.location && ` · ${report.location}`}
            {folderName !== 'Uncategorized' && ` · ${folderName}`}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Primary Actions */}
        <section className="flex flex-wrap gap-3">
          {report.pdf_url && (
            <a
              href={report.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View PDF
            </a>
          )}
          
          {report.file_url && (
            <a
              href={report.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Watch Video
            </a>
          )}
          
          {report.pdf_url && (
            <a
              href={report.pdf_url}
              download
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
          )}
        </section>

        {/* Summary Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{summaryText}</p>
        </section>

        {/* Verification Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="font-medium text-gray-900">Case ID:</span> {report.id}
            </p>
            <p className="text-gray-600">
              <span className="font-medium text-gray-900">Created:</span> {new Date(report.created_at).toISOString()}
            </p>
            {report.location && (
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Location:</span> {report.location}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            This document is timestamped and can be verified at proof.ai
          </p>
        </section>
      </main>
    </div>
  )
}
