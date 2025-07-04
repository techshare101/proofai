import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function deleteFolder(folderId: string, userId: string) {
  try {
    // Get folder record
    const { data: folderData, error: fetchError } = await supabase
      .from('folders')
      .select('name')
      .eq('id', folderId)
      .single();

    if (fetchError) throw fetchError;
    const folderName = folderData?.name;
    if (!folderName) throw new Error('Folder name missing');

    // Build path prefix (assuming folder is stored under userEmail/folderName)
    const { data: user } = await supabase.auth.getUser();
    const email = user?.user?.email || userId;

    const storagePath = `${email}/${folderName}`;

    // Try deleting from known buckets
    const buckets = ['reports', 'recordings'];
    for (const bucket of buckets) {
      const { data: listData, error: listError } = await supabase.storage
        .from(bucket)
        .list(storagePath, { limit: 100 });

      if (listError) {
        console.warn(`[FolderDelete] Could not list from ${bucket}`, listError.message);
        continue;
      }

      if (listData && listData.length > 0) {
        const filesToDelete = listData.map(file => `${storagePath}/${file.name}`);
        console.log(`[FolderDelete] Deleting files in ${bucket}:`, filesToDelete);
        await supabase.storage.from(bucket).remove(filesToDelete);
      }
    }

    // Finally, delete the folder from the DB
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (err) {
    console.error('[FolderDelete] Error deleting folder:', err);
    return { success: false, error: err.message };
  }
}
