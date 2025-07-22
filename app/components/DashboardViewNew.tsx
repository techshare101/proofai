"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from 'react-hot-toast';

interface Report {
  id: string;
  title: string;
  file_url: string | null;
  record_url: string | null;
  created_at: string;
  language?: string | null;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
}

export default function DashboardViewNew() {
  const supabase = createClientComponentClient();

  const [reports, setReports] = useState<Report[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState<string | null>(null);
  const [renamingReportId, setRenamingReportId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkStripeSession = async () => {
      const sessionId = searchParams?.get('session_id');
      if (sessionId) {
        try {
          const response = await fetch('/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          
          const result = await response.json();
          
          if (result.success) {
            setSubscriptionStatus({
              show: true,
              success: true,
              message: '🎉 Subscription successful! Your account has been upgraded.'
            });
            
            // Remove the session_id from URL without page reload
            const url = new URL(window.location.href);
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.toString());
          } else {
            throw new Error(result.error || 'Failed to verify subscription');
          }
        } catch (error) {
          setSubscriptionStatus({
            show: true,
            success: false,
            message: `❌ ${error instanceof Error ? error.message : 'Failed to verify subscription'}`
          });
        }
      }
    };

    loadAll().then(() => {
      // Only check for Stripe session after initial load
      checkStripeSession();
    });
  }, [currentFolder]);

  const loadAll = async () => {
    setRefreshing(true);
    await fetchFolders();
    await fetchReports();
    setRefreshing(false);
    setLoading(false);
  };

  const fetchFolders = async () => {
    const { data, error } = await supabase.from("folders").select("*").order("name");
    if (!error) setFolders(data || []);
  };

  const fetchReports = async () => {
    let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (currentFolder) {
      query = query.eq("folder_id", currentFolder);
    }
    const { data, error } = await query;
    if (!error) setReports(data || []);
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder?")) return;
    await supabase.from("folders").delete().eq("id", folderId);
    if (currentFolder === folderId) setCurrentFolder(null);
    fetchFolders();
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    await supabase.from("reports").delete().eq("id", id);
    fetchReports();
  };

  const moveToFolder = async (reportId: string, folderId: string) => {
    await supabase.from("reports").update({ folder_id: folderId }).eq("id", reportId);
    setShowMoveMenu(null);
    fetchReports();
  };

  const renameReport = async (reportId: string) => {
    if (!renameValue.trim()) {
      alert('Title cannot be empty.');
      return;
    }
    await supabase
      .from('reports')
      .update({ title: renameValue.trim() })
      .eq('id', reportId);

    setRenamingReportId(null);
    setRenameValue('');
    fetchReports();
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const SubscriptionStatusBanner = () => {
    if (!subscriptionStatus?.show) return null;
    
    return (
      <div className={`mb-6 p-4 rounded-lg ${
        subscriptionStatus.success 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          {subscriptionStatus.success ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          )}
          <p className={`text-sm ${subscriptionStatus.success ? 'text-green-700' : 'text-red-700'}`}>
            {subscriptionStatus.message}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
    </div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SubscriptionStatusBanner />
      {/* Sidebar */}
      <div className="w-64 border-r bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">Folders</h2>
          <button
            onClick={fetchFolders}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div
          className={`px-3 py-2 rounded cursor-pointer mb-2 ${
            currentFolder === null ? "bg-blue-100 text-blue-600 font-medium" : "hover:bg-gray-100"
          }`}
          onClick={() => setCurrentFolder(null)}
        >
          All Reports
        </div>
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`flex justify-between items-center px-3 py-2 rounded mb-1 ${
              currentFolder === folder.id ? "bg-blue-100 text-blue-600 font-medium" : "hover:bg-gray-100"
            }`}
          >
            <span
              className="flex-1 cursor-pointer"
              onClick={() => setCurrentFolder(folder.id)}
            >
              {folder.name}
            </span>
            <button
              onClick={() => deleteFolder(folder.id)}
              className="text-red-500 hover:text-red-700 text-sm ml-2"
              title="Delete Folder"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentFolder ? folders.find((f) => f.id === currentFolder)?.name : "All Reports"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {reports.length} {reports.length === 1 ? "report" : "reports"} found
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadAll}
              disabled={refreshing}
              className="px-3 py-2 border rounded-md text-sm flex items-center gap-1 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <a
              href="/recorder"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              🎥 New Recording
            </a>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No reports in this folder.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {report.title || "Untitled Report"}
                    </h3>
                    {report.language && (
                      <span className="ml-2 flex items-center text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        🌐 {report.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(report.created_at)}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {renamingReportId === report.id ? (
                    <div className="w-full">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="border rounded-md px-2 py-1.5 text-sm w-full mb-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameReport(report.id);
                          if (e.key === 'Escape') {
                            setRenamingReportId(null);
                            setRenameValue('');
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => renameReport(report.id)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setRenamingReportId(null);
                            setRenameValue('');
                          }}
                          className="px-3 py-1.5 border text-xs rounded-md hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {report.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[80px] inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50"
                        >
                          📄 View PDF
                        </a>
                      )}
                      {report.record_url && (
                        <a
                          href={report.record_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[80px] inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50"
                        >
                          🎥 Watch Video
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setRenamingReportId(report.id);
                          setRenameValue(report.title || '');
                        }}
                        className="flex-1 min-w-[60px] inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        ✏️ Rename
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="flex-1 min-w-[60px] inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-red-300 text-xs text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        🗑️ Delete
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMoveMenu(showMoveMenu === report.id ? null : report.id)
                          }
                          className="px-2 py-1.5 rounded-md border text-xs text-gray-600 bg-gray-50 hover:bg-gray-100"
                        >
                          📁 Move
                        </button>
                        {showMoveMenu === report.id && (
                          <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                            {folders.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => moveToFolder(report.id, f.id)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                📁 {f.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
