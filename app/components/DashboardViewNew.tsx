"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2, RefreshCw } from "lucide-react";

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

  useEffect(() => {
    loadAll();
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

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex min-h-screen bg-gray-50">
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

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : reports.length === 0 ? (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
