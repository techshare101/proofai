"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface Report {
  id?: string;
  caseId?: string;
  location?: string;
  created_at: string;
  file_url?: string;
  record_url?: string;
  title?: string;
  summary?: string;
  language_detected?: string;
  // Keeping videoUrl for backward compatibility
  videoUrl?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("❌ Authentication error:", sessionError?.message || "No active session");
        setError("Please sign in to view your reports");
        router.push("/login");
        return;
      }

      console.log("🔑 Fetching reports for user:", session.user.id);
      
      // Fetch reports for the current user
      const { data, error: fetchError } = await supabase
        .from("reports")
        .select('*')
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("❌ Error fetching reports:", fetchError);
        setError("Failed to load reports. Please try again.");
        setReports([]);
      } else {
        console.log(`✅ Fetched ${data?.length || 0} reports`);
        setReports(data || []);
      }
    } catch (err) {
      console.error("❌ Unexpected error in fetchReports:", err);
      setError("An unexpected error occurred. Please try again.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = reports.filter(
    (r) =>
      (r.caseId || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleNewRecording = () => {
    router.push("/recorder");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(reports.map(report => report.id!));
    } else {
      setSelectedIds([]);
    }
  };

  // Helper to extract storage path from URL
  const extractStoragePath = (url: string): string => {
    try {
      // Handle both signed and public URLs
      const signedUrlMatch = url.match(/\/storage\/v1\/object\/public\/([^?]+)/);
      if (signedUrlMatch) return signedUrlMatch[1];
      
      const publicUrlMatch = url.split('/object/public/');
      if (publicUrlMatch.length > 1) return publicUrlMatch[1];
      
      return '';
    } catch {
      return '';
    }
  };

  const handleDeleteReport = async (reportId: string, pdfUrl?: string, videoUrl?: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    await deleteSingleReport(reportId, pdfUrl, videoUrl);
  };

  const deleteSingleReport = async (reportId: string, pdfUrl?: string, videoUrl?: string) => {
    setDeletingId(reportId);
    const toastId = toast.loading('Deleting report...');
    
    try {
      // 1. Delete row from reports table
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) throw deleteError;

      // 2. Delete PDF from storage if URL exists
      if (pdfUrl) {
        const pdfPath = extractStoragePath(pdfUrl);
        if (pdfPath) {
          const { error: pdfError } = await supabase.storage
            .from('reports')
            .remove([pdfPath]);
          
          if (pdfError) console.warn('Failed to delete PDF:', pdfError);
        }
      }

      // 3. Delete video from storage if URL exists
      if (videoUrl) {
        const videoPath = extractStoragePath(videoUrl);
        if (videoPath) {
          const { error: videoError } = await supabase.storage
            .from('recordings')
            .remove([videoPath]);
          
          if (videoError) console.warn('Failed to delete video:', videoError);
        }
      }

      // Update UI by removing the deleted report
      setReports(prev => prev.filter(r => r.id !== reportId));
      setSelectedIds(prev => prev.filter(id => id !== reportId));
      toast.success('Report deleted successfully', { id: toastId });
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Failed to delete report', { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected report(s)? This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading(`Deleting ${selectedIds.length} report(s)...`);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process deletions in parallel
      await Promise.all(selectedIds.map(async (id) => {
        const report = reports.find(r => r.id === id);
        if (!report) return;

        try {
          await deleteSingleReport(report.id!, report.file_url, report.videoUrl);
          successCount++;
        } catch (err) {
          console.error(`Error deleting report ${id}:`, err);
          errorCount++;
        }
      }));

      // Show summary toast
      let message = '';
      if (successCount > 0 && errorCount === 0) {
        message = `Successfully deleted ${successCount} report(s)`;
        toast.success(message, { id: toastId });
      } else if (successCount > 0) {
        message = `Deleted ${successCount} report(s), failed to delete ${errorCount} report(s)`;
        toast(message, { 
          id: toastId,
          icon: '⚠️',
          style: { background: '#fef3c7', color: '#92400e' }
        });
      } else {
        message = `Failed to delete ${errorCount} report(s)`;
        toast.error(message, { id: toastId });
      }

      // Refresh the reports list
      fetchReports();
    } catch (err) {
      console.error('Error during bulk delete:', err);
      toast.error('An error occurred during bulk delete', { id: toastId });
    } finally {
      setSelectedIds([]);
    }
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ProofAI Dashboard</h1>
          <p className="text-sm text-gray-600">View and manage your reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleNewRecording}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            New Recording
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by case ID, location, or title..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search reports"
        />
        <button
          onClick={fetchReports}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">🔄</span> Refreshing...
            </>
          ) : (
            <>
              <span>🔄</span> Refresh
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">
            {search ? 'No matching reports found.' : 'No reports available.'}
          </p>
          <button
            onClick={handleNewRecording}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            Create your first report →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((report, idx) => (
            <div
              key={report.id || idx}
              className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border ${
                isSelected(report.id!) ? 'ring-2 ring-purple-500' : 'border-gray-100'
              } overflow-hidden flex flex-col`}
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected(report.id!)}
                      onChange={() => toggleSelect(report.id!)}
                      className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {report.title || `Report ${idx + 1}`}
                    </h3>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {report.caseId || 'No ID'}
                  </span>
                </div>
                
                {report.summary && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {report.summary}
                  </p>
                )}
                
                <div className="mt-3 space-y-1 text-sm">
                  {report.location && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📍</span>
                      <span className="truncate">{report.location}</span>
                    </div>
                  )}
                  
                  {report.language_detected && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🌐</span>
                      <span>{report.language_detected}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-500 text-xs">
                    <span className="mr-2">📅</span>
                    <span>
                      {new Date(report.created_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-5 py-3 flex flex-col gap-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  {report.file_url ? (
                    <a
                      href={report.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📄</span> PDF
                    </a>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-100 text-gray-400 px-3 py-2 rounded-md text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>📄</span> No PDF
                    </button>
                  )}
                  
                  {report.record_url || report.videoUrl ? (
                    <a
                      href={report.record_url || report.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🎥</span> Video
                    </a>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-100 text-gray-400 px-3 py-2 rounded-md text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>🎥</span> No Video
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteReport(report.id!, report.file_url, report.videoUrl)}
                  disabled={deletingId === report.id}
                  className="w-full mt-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === report.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
