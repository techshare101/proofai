import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Deletes a folder:
 * - Removes all files from Supabase storage at userEmail/folderName/
 * - Deletes the folder record from Supabase database
 */
export async function deleteFolder(folderId: string, userId: string) {
  try {
    console.log(`[DeleteFolder] 🔍 Fetching folder name for ID: ${folderId}`);
    
    // First check if the folder exists
    const { data: folderExists, error: existsError } = await supabase
      .from('folders')
      .select('count')
      .eq('id', folderId);
      
    if (existsError) {
      console.error(`[DeleteFolder] Error checking if folder exists:`, existsError);
      throw new Error(`Failed to check if folder exists: ${existsError.message}`);
    }
    
    if (!folderExists || folderExists.length === 0 || folderExists[0].count === 0) {
      console.error(`[DeleteFolder] No folder found with ID: ${folderId}`);
      throw new Error(`Folder with ID ${folderId} not found`);
    }
    
    // Now fetch the folder name
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .select('name')
      .eq('id', folderId)
      .maybeSingle(); // Use maybeSingle instead of single to prevent errors

    if (folderError) {
      console.error(`[DeleteFolder] Error fetching folder name:`, folderError);
      throw folderError;
    }
    
    if (!folderData) {
      console.error(`[DeleteFolder] Folder data is null after successful check`);
      throw new Error(`Folder data could not be retrieved`);
    }

    const folderName = folderData.name;

    console.log(`[DeleteFolder] 📧 Getting current user email...`);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) throw userError;

    const userEmail = user.email;
    const pathPrefix = `${userEmail}/${folderName}/`;
    const bucket = 'reports';

    console.log(`[DeleteFolder] 📁 Listing files in ${bucket}/${pathPrefix}`);

    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list(pathPrefix, { limit: 100 });

    if (listError) {
      console.warn(`[DeleteFolder] ⚠️ Could not list files in storage:`, listError);
    }

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${pathPrefix}${file.name}`);
      console.log(`[DeleteFolder] 🧹 Deleting ${filePaths.length} files...`);

      const { error: deleteFilesError } = await supabase
        .storage
        .from(bucket)
        .remove(filePaths);

      if (deleteFilesError) {
        console.error(`[DeleteFolder] ❌ Failed to delete files:`, deleteFilesError);
      } else {
        console.log(`[DeleteFolder] ✅ Files deleted from storage.`);
      }
    } else {
      console.log(`[DeleteFolder] 📭 No files found to delete.`);
    }

    console.log(`[DeleteFolder] 🗑 Deleting folder record from database...`);

    const { error: dbDeleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (dbDeleteError) throw dbDeleteError;

    console.log(`[DeleteFolder] ✅ Folder deleted from DB.`);

    return { success: true };
  } catch (err) {
    console.error('[DeleteFolder] ❌ Failed to delete folder:', err);
    
    // Properly serialize the error for UI display
    let errorMessage = 'Unknown error';
    if (err instanceof Error) {
      console.error('[DeleteFolder] Error details:', err.message);
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null) {
      try {
        errorMessage = JSON.stringify(err);
      } catch (e) {
        errorMessage = 'Error object could not be serialized';
      }
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}
