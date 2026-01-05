import supabase from '../app/lib/supabase';

export async function deleteFolder(folderId: string, userId: string) {
  try {
    // First, get the folder name
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('name')
      .eq('id', folderId)
      .eq('user_id', userId)
      .single();
    
    if (folderError) throw new Error(folderError.message);
    if (!folder) throw new Error('Folder not found');
    
    // Get the authenticated user's email
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    
    const email = userData?.user?.email;
    if (!email) throw new Error('User email not found');
    
    // Construct the folder path
    const folderPath = `${email}/${folder.name}/`;
    
    // Step 1: List all files in the folder
    const { data: files, error: listError } = await supabase
      .storage
      .from('reports')
      .list(folderPath);
    
    if (listError) throw new Error(`Error listing files: ${listError.message}`);
    
    // Step 2: Remove all files if there are any
    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${folderPath}${f.name}`);
      const { error: deleteError } = await supabase
        .storage
        .from('reports')
        .remove(filePaths);
      
      if (deleteError) throw new Error(`Error deleting folder files: ${deleteError.message}`);
    }
    
    // Step 3: Orphan all reports in this folder (move to "All Reports")
    // CRITICAL: Do NOT delete reports when folder is deleted
    const { error: orphanError } = await supabase
      .from('reports')
      .update({ folder_id: null })
      .eq('folder_id', folderId)
      .eq('user_id', userId);
    
    if (orphanError) {
      console.warn(`Warning: Could not orphan reports: ${orphanError.message}`);
      // Continue anyway - folder delete is more important
    }
    
    // Step 4: Remove the folder from the database
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);
    
    if (error) throw new Error(error.message);
    
    console.log(`✅ Deleted folder ${folder.name} (reports moved to All Reports)`);
    return true;
  } catch (error) {
    console.error('Error in deleteFolder:', error);
    throw error;
  }
}
