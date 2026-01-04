import { createBrowserClient } from '@supabase/ssr';
import { format, formatDistanceToNow } from 'date-fns';

// Lazy-initialize Supabase client to avoid build-time errors
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!_supabase && typeof window !== 'undefined') {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// For backward compatibility - returns a proxy that lazy-initializes
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) return () => Promise.resolve({ data: null, error: null });
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

export interface Report {
  id: string;
  title: string;
  summary: string;
  location: string;
  file_url: string; // video_url in SQL query
  original_transcript: string;
  translated_transcript: string;
  created_at: string;
  folder_id: string;
  folder_name: string; // from folders table
}

export interface FolderGroup {
  id: string;
  name: string;
  reports: Report[];
  isExpanded: boolean;
}

// Format date for display
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'MMM dd, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
}

// Format relative time
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return '';
  }
}

// Group reports by folder name
export function groupReportsByFolder(reports: Report[]): FolderGroup[] {
  const groupMap = new Map<string, FolderGroup>();
  
  // Handle reports with no folder
  const uncategorizedId = 'uncategorized';
  groupMap.set(uncategorizedId, {
    id: uncategorizedId,
    name: 'Uncategorized',
    reports: [],
    isExpanded: true
  });
  
  reports.forEach(report => {
    const folderId = report.folder_id || uncategorizedId;
    const folderName = report.folder_name || 'Uncategorized';
    
    if (!groupMap.has(folderId)) {
      groupMap.set(folderId, {
        id: folderId,
        name: folderName,
        reports: [],
        isExpanded: false
      });
    }
    
    groupMap.get(folderId)!.reports.push(report);
  });
  
  // Convert map to array and sort by folder name
  return Array.from(groupMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Export reports to CSV
export function exportToCSV(reports: Report[]): void {
  if (reports.length === 0) return;
  
  // Define CSV columns
  const columns = [
    'Title',
    'Summary',
    'Location',
    'Folder',
    'Created',
    'Original Transcript',
    'Translated Transcript'
  ];
  
  // Transform reports to CSV rows
  const rows = reports.map(report => [
    `"${report.title?.replace(/"/g, '""') || ''}"`,
    `"${report.summary?.replace(/"/g, '""') || ''}"`,
    `"${report.location?.replace(/"/g, '""') || ''}"`,
    `"${report.folder_name?.replace(/"/g, '""') || 'Uncategorized'}"`,
    formatDate(report.created_at),
    `"${report.original_transcript?.replace(/"/g, '""') || ''}"`,
    `"${report.translated_transcript?.replace(/"/g, '""') || ''}"`,
  ]);
  
  // Create CSV content
  const csvContent = [
    columns.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reports_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
