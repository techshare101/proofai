import supabase from '../app/lib/supabase';

export async function fetchReportsByFolder(folderId: string, userId: string) {
  try {
    // First, get the folder name from the folders table
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
    
    // List all files in the folder from Supabase storage
    const { data, error } = await supabase
      .storage
      .from('reports')
      .list(folderPath, { 
        limit: 100, 
        sortBy: { column: 'created_at', order: 'desc' } 
      });
    
    if (error) throw new Error(`Error listing files: ${error.message}`);
    
    // Format the data to match what the UI expects
    // We'll need to fetch signed URLs for each file
    const formattedData = await Promise.all(data.map(async (file) => {
      // Get a signed URL for the file
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('reports')
        .createSignedUrl(`${folderPath}${file.name}`, 3600); // 1 hour expiry
      
      if (urlError) {
        console.error(`Error getting signed URL for ${file.name}:`, urlError);
      }
      
      // Extract basic info from filename (this may need refinement based on your naming convention)
      const nameParts = file.name.split('-');
      const title = nameParts.length > 1 ? nameParts.slice(1).join('-').replace('.pdf', '') : file.name;
      
      return {
        id: file.id || file.name, // Use file ID or name as a fallback
        title: title || 'Untitled Report',
        summary: 'Report from storage', // Default summary
        pdf_url: urlData?.signedUrl || '',
        folder_id: folderId,
        created_at: file.created_at || new Date().toISOString()
      };
    }));
    
    return formattedData;
  } catch (error) {
    console.error('Error in fetchReportsByFolder:', error);
    throw error;
  }
}
