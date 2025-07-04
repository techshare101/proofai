// Utility for uploading PDFs to Supabase storage
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Uploads a PDF blob to Supabase storage
 * @param supabase SupabaseClient instance
 * @param userId User ID for organizing files
 * @param pdfBlob The PDF as a Blob
 * @param customFilename Optional custom filename (without path)
 * @returns The URL of the uploaded file, or null if upload failed
 */
export const uploadPdfToSupabase = async (
  supabase: SupabaseClient,
  userId: string,
  pdfBlob: Blob,
  customFilename?: string
): Promise<string | null> => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = customFilename 
      ? `${userId}/${customFilename}`
      : `${userId}/${timestamp}-report.pdf`;

    console.log(`[uploadPdfToSupabase] Uploading PDF for user ${userId} to storage path: ${filename}`);
    
    // Upload the PDF to the reports bucket
    const { error, data } = await supabase
      .storage
      .from("reports")
      .upload(filename, pdfBlob, {
        contentType: "application/pdf",
        upsert: true, // Overwrite if needed
      });

    if (error) {
      console.error("[uploadPdfToSupabase] PDF upload failed:", error);
      return null;
    }
    
    console.log(`[uploadPdfToSupabase] PDF uploaded successfully to: ${filename}`);

    // Return the path for the signed URL (not the public URL)
    // This is just "reports/userId/timestamp-report.pdf" format
    return `reports/${filename}`;
  } catch (error) {
    console.error("[uploadPdfToSupabase] Error uploading PDF:", error);
    return null;
  }
};

/**
 * Gets a signed URL for a previously uploaded PDF
 * @param supabase SupabaseClient instance
 * @param pdfPath The PDF path in storage (e.g., "reports/userId/filename.pdf")
 * @param expiresIn Expiration time in seconds (default 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
export const getSignedPdfUrl = async (
  supabase: SupabaseClient,
  pdfPath: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    // Extract bucket and object path from the full path
    const pathParts = pdfPath.replace(/^\/+/, '').split('/');
    const bucketName = pathParts[0]; // First part is the bucket name (e.g., "reports")
    const objectPath = pathParts.slice(1).join('/'); // Rest is the object path
    
    if (!bucketName || !objectPath) {
      console.error(`[getSignedPdfUrl] Invalid path format: ${pdfPath}`);
      return null;
    }
    
    console.log(`[getSignedPdfUrl] Generating signed URL for: bucket=${bucketName}, path=${objectPath}`);
    
    // Generate a signed URL
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(objectPath, expiresIn);
    
    if (error || !data) {
      console.error("[getSignedPdfUrl] Error generating signed URL:", error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error("[getSignedPdfUrl] Error:", error);
    return null;
  }
};
