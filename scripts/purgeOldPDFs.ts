import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Purges old PDFs from the 'recordings/reports' legacy storage path
 * @param {boolean} onlySmallFiles If true, only removes files smaller than 5KB
 * @returns {Promise<void>}
 */
async function purgeOldPDFs(onlySmallFiles = false) {
  console.log('🧹 Starting PDF cleanup...');
  console.log(`Mode: ${onlySmallFiles ? 'Removing only small/broken PDFs (<5KB)' : 'Removing ALL legacy PDFs'}`);
  
  // List all files in the legacy storage path
  const { data, error } = await supabase.storage
    .from('recordings')
    .list('reports');

  if (error) {
    console.error('❌ Failed to list files:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✅ No legacy PDFs found to delete.');
    return;
  }

  console.log(`📊 Found ${data.length} total PDFs in legacy storage.`);

  // Filter files if only removing small/broken PDFs
  const filesToDelete = onlySmallFiles 
    ? data.filter(file => {
        const fileSize = file.metadata?.size || 0;
        const isTooSmall = fileSize < 5000; // Less than 5KB
        if (isTooSmall) {
          console.log(`🔍 Will delete: ${file.name} (${Math.round(fileSize/1024)}KB - too small)`);
        }
        return isTooSmall;
      })
    : data;

  if (onlySmallFiles) {
    console.log(`🔍 Found ${filesToDelete.length} small/broken PDFs to remove.`);
  }

  // Create paths for all files to delete
  const allPaths = filesToDelete.map((file) => `reports/${file.name}`);

  if (allPaths.length === 0) {
    console.log('✅ No PDFs to delete based on current filter.');
    return;
  }

  // Confirm deletion
  console.log(`⚠️ Preparing to delete ${allPaths.length} PDF(s) from recordings/reports/`);
  console.log('First 5 files to delete:', allPaths.slice(0, 5));

  // Delete the files
  const { error: delErr } = await supabase.storage
    .from('recordings')
    .remove(allPaths);

  if (delErr) {
    console.error('❌ Failed to delete files:', delErr);
  } else {
    console.log(`✅ Successfully deleted ${allPaths.length} PDF(s) from recordings/reports/`);
  }
  
  console.log('🧼 Cleanup complete. Check the dashboard for a clean slate!');
}

// Export the function for use in other files or scripts
export default purgeOldPDFs;

// Allow direct execution with arguments
if (require.main === module) {
  const onlySmallFiles = process.argv.includes('--only-small');
  purgeOldPDFs(onlySmallFiles)
    .then(() => {
      console.log('Script execution complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Script execution failed:', err);
      process.exit(1);
    });
}
