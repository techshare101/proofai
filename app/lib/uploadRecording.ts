// lib/uploadRecording.ts
import { supabase } from './supabase';
import { TranscriptionService } from '../services/transcriptionService';
import { generateVideoSummary } from './summaryClient';
import { generatePDF } from '../utils/generatePDF';

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

    // 6. Calculate video duration
    console.log('⏱ Calculating video duration...');
    const duration = await new Promise<number>((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(blob);
    });
    console.log('✅ Duration calculated:', duration, 'seconds');

    // 7. Generate transcript
    console.log('🎙️ Starting transcription...');
    console.log('Audio blob:', {
      type: blob.type,
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`
    });
    const transcriptionService = await TranscriptionService.getInstance();
    const transcript = await transcriptionService.transcribe(blob);
    console.log('🎙️ Whisper Transcript:', transcript);
    if (!transcript) {
      throw new Error('No transcript returned from Whisper');
    }
    console.log('✅ Transcript generated successfully');

    // 8. Generate summary
    console.log('📝 Generating summary...');
    const summaryResult = await generateVideoSummary(urlData.publicUrl, transcript);
    console.log('✅ Summary generated');

    // 9. Generate PDF
    console.log('📄 Generating PDF report...');
    try {
      // Call PDF generation API
      console.log('📝 Calling PDF generation API...');
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            summary: summaryResult.summary,
            participants: ['Witness: Kojo'],
            keyEvents: [
              `Recording Time: ${new Date().toLocaleString()}`,
              'Video recording of incident',
              ...(summaryResult.keyEvents || [])
            ],
            context: {
              time: new Date().toLocaleString(),
              location: summaryResult.context?.location || 'Unknown',
              environmentalFactors: summaryResult.context?.environmentalFactors || 'None noted'
            },
            notableQuotes: [
              '🎙️ WITNESS STATEMENT',
              transcript || 'No transcript available'
            ],
            reportRelevance: summaryResult.reportRelevance || {
              legal: false,
              hr: true,
              safety: false,
              explanation: 'Workplace incident recorded for documentation.'
            },
            videoUrl: urlData.publicUrl
          },
          options: {
            caseId: filename.split('/')[1].split('-')[0],
            reviewedBy: 'ProofAI Whisper Bot',
            confidential: true
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`PDF generation failed: ${error.error}`);
      }

      const { path: pdfPath } = await response.json();
      console.log('✅ PDF generated at:', pdfPath);
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError);
      if (pdfError instanceof Error) {
        console.error('PDF error stack:', pdfError.stack);
      }
    }

    // 10. Create database record
    console.log('💾 Creating database record...');
    const { error: insertError } = await supabase
      .from('recordings')
      .insert({
        title: `Recording ${timestamp}`,
        storage_path: storageData.path,
        duration,
        transcript: transcript,
        summary: summaryResult.summary
      });

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

    // Check for specific error types
    if (uploadError.message?.includes('Permission denied')) {
      throw new Error('Camera or microphone access denied. Please allow access in your browser settings.');
    } else if (uploadError.message?.includes('NotFoundError')) {
      throw new Error('Camera or microphone not found. Please check your device connections.');
    } else if (uploadError.message?.includes('NotReadableError')) {
      throw new Error('Camera or microphone is in use by another application.');
    } else if (uploadError.stage === 'auth') {
      throw new Error('Authentication failed. Please sign in again.');
    } else if (uploadError.stage === 'storage') {
      throw new Error('Failed to upload recording. Please check your internet connection.');
    } else if (uploadError.stage === 'database') {
      throw new Error('Failed to save recording details. Please try again.');
    } else {
      throw new Error(
        `Upload failed during ${uploadError.stage || 'process'}: ${uploadError.message}`
      );
    }
  }
}
