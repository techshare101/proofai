// lib/uploadRecording.ts
import { supabase } from './supabase';

interface UploadError extends Error {
  stage?: 'auth' | 'blob' | 'storage' | 'url' | 'database';
  details?: unknown;
}

export async function uploadRecording(blob: Blob, location = '') {
  console.group('📹 Upload Recording Process');
  
  try {
    // 1. Validate blob
    console.log('🔍 Validating recording blob...');
    if (!blob || blob.size === 0) {
      const err = new Error('No recording data available') as UploadError;
      err.stage = 'blob';
      throw err;
    }
    console.log('✅ Blob valid:', {
      type: blob.type,
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`
    });

    // 2. Check authentication
    console.log('🔐 Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('❌ Auth error:', sessionError || 'No session');
      const err = new Error(
        sessionError?.message || 'Please sign in to upload recordings'
      ) as UploadError;
      err.stage = 'auth';
      err.details = sessionError;
      throw err;
    }
    console.log('✅ Authenticated as:', session.user.email);

    // 3. Prepare upload
    const userId = session.user.id;
    const timestamp = new Date().toISOString();
    const filename = `${userId}/${timestamp}-recording.webm`;
    console.log('📝 Preparing upload:', { filename, location });

    // 4. Upload to storage
    console.log('⬆️ Uploading to Supabase storage...');
    const { data: storageData, error: storageError } = await supabase.storage
      .from('recordings')
      .upload(filename, blob, {
        contentType: 'video/webm',
        duplex: 'half',
        upsert: false
      });

    if (storageError || !storageData?.path) {
      console.error('❌ Storage error:', storageError);
      const err = new Error(
        `Storage upload failed: ${storageError?.message || 'No path returned'}`
      ) as UploadError;
      err.stage = 'storage';
      err.details = storageError;
      throw err;
    }
    console.log('✅ Upload successful:', storageData.path);

    // 5. Generate public URL
    console.log('🔗 Generating public URL...');
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(storageData.path);

    if (!urlData?.publicUrl) {
      const err = new Error('Failed to generate public URL') as UploadError;
      err.stage = 'url';
      throw err;
    }
    console.log('✅ Public URL generated');

    // 6. Create database record
    console.log('💾 Creating database record...');
    const { error: insertError } = await supabase
      .from('recordings')
      .insert([
        {
          title: `Recording ${timestamp}`,
          storage_path: storageData.path,
          file_url: urlData.publicUrl,
          user_id: userId,
          location,
          duration: 0, // TODO: Calculate actual duration
          transcript: ''
        }
      ]);

    if (insertError) {
      console.warn('⚠️ Database insert failed:', insertError);
      // Don't throw - we still want to return the URL
    } else {
      console.log('✅ Database record created');
    }

    console.log('🎉 Upload process complete!');
    console.groupEnd();
    return urlData.publicUrl;

  } catch (err) {
    const uploadError = err as UploadError;
    console.error('❌ Upload failed:', {
      stage: uploadError.stage || 'unknown',
      message: uploadError.message,
      details: uploadError.details
    });
    console.groupEnd();
    throw new Error(
      `Upload failed during ${uploadError.stage || 'process'}: ${uploadError.message}`
    );
  }
}
