import { supabase } from '@/lib/supabaseClient';

export async function handleManualUpload(file: File, folderName: string, userId: string) {
  if (!file || !userId) {
    throw new Error('File and user ID are required');
  }

  try {
    // Sanitize folder name to remove special characters
    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9-_]/g, '');
    const fileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, '');
    
    // Build the storage path: userId/folderName/filename
    const path = `${userId}/${sanitizedFolderName}/${Date.now()}_${fileName}`;

    console.log(`📤 Uploading file to: ${path}`);

    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(path, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError.message);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: publicData } = supabase.storage
      .from('reports')
      .getPublicUrl(path);
    
    const fileUrl = publicData?.publicUrl;
    if (!fileUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    // 3. Insert metadata into reports table
    const { error: insertError } = await supabase
      .from('reports')
      .insert([
        {
          user_id: userId,
          title: file.name,
          folder_name: sanitizedFolderName,
          file_url: fileUrl,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('❌ Database insert failed:', insertError.message);
      throw new Error(`Failed to save file metadata: ${insertError.message}`);
    }

    console.log('✅ File uploaded and metadata saved successfully');
    return { success: true, path };
  } catch (error) {
    console.error('❌ Error in handleManualUpload:', error);
    throw error;
  }
}

export async function getFoldersForUser(userId: string) {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('reports')
    .select('folder_name')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
  
  // Get unique folder names
  const folders = Array.from(new Set(data.map(item => item.folder_name).filter(Boolean)));
  return folders;
}
