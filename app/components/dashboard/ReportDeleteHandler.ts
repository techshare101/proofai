// ReportDeleteHandler.ts
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

export async function deleteReportWithFiles(reportId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  try {
    // First fetch the report to get file paths
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, file_url, pdf_url')
      .eq('id', reportId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    // Handle storage deletion for file_url
    if (report.file_url) {
      // Extract path from URL if needed
      let filePath = report.file_url;
      
      // If it's a full URL, try to extract the path
      if (filePath.startsWith('http')) {
        try {
          // Extract path from the URL (this is an approximation)
          const url = new URL(filePath);
          const pathParts = url.pathname.split('/');
          // Last two segments usually represent bucket/filename in Supabase
          if (pathParts.length >= 2) {
            filePath = pathParts[pathParts.length - 1];
          }
        } catch (e) {
          console.error('Could not parse file URL', e);
        }
      }
      
      // Attempt deletion from multiple potential buckets
      const buckets = ['recordings', 'files', 'reports', 'uploads', 'audio'];
      
      for (const bucket of buckets) {
        try {
          console.log(`Attempting to delete file from ${bucket}: ${filePath}`);
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);
          
          if (!deleteError) {
            console.log(`Successfully deleted file from ${bucket}`);
            break; // Stop if successful
          }
        } catch (e) {
          console.log(`Error trying to delete from ${bucket}`, e);
        }
      }
    }
    
    // Handle storage deletion for pdf_url
    if (report.pdf_url) {
      // Extract path from URL if needed
      let pdfPath = report.pdf_url;
      
      // If it's a full URL, try to extract the path
      if (pdfPath.startsWith('http')) {
        try {
          // Extract path from the URL (this is an approximation)
          const url = new URL(pdfPath);
          const pathParts = url.pathname.split('/');
          // Last two segments usually represent bucket/filename in Supabase
          if (pathParts.length >= 2) {
            pdfPath = pathParts[pathParts.length - 1];
          }
        } catch (e) {
          console.error('Could not parse PDF URL', e);
        }
      }
      
      // Attempt deletion from multiple potential buckets
      const buckets = ['proofai-pdfs', 'pdfs', 'reports', 'public'];
      
      for (const bucket of buckets) {
        try {
          console.log(`Attempting to delete PDF from ${bucket}: ${pdfPath}`);
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([pdfPath]);
          
          if (!deleteError) {
            console.log(`Successfully deleted PDF from ${bucket}`);
            break; // Stop if successful
          }
        } catch (e) {
          console.log(`Error trying to delete from ${bucket}`, e);
        }
      }
    }
    
    // Finally, delete the database record
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    toast.success('Report and associated files deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error in deleteReportWithFiles:', error);
    toast.error(`Failed to delete report: ${error.message || 'Unknown error'}`);
    return false;
  }
}
