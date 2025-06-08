export interface UploadError extends Error {
  stage?: 'auth' | 'blob' | 'storage' | 'url' | 'database' | 'transcription' | 'summary' | 'pdf';
  details?: unknown;
}

import { supabase } from '../lib/supabase';
import { TranscriptionService } from './transcriptionService';
import { generateVideoSummary } from '../lib/summaryClient';

export class UploadService {
  /**
   * Upload a recording blob to Supabase storage and trigger downstream
   * processing including transcription, summary generation and PDF download.
   * Returns the public URL for the uploaded video on success.
   */
  public static async uploadRecording(blob: Blob, location = ''): Promise<string> {
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
      const transcriptionService = await TranscriptionService.getInstance();
      let transcript: string | undefined;
      try {
        transcript = await transcriptionService.transcribe(blob);
      } catch (err) {
        const error = err as UploadError;
        error.stage = 'transcription';
        throw error;
      }
      console.log('✅ Transcript generated successfully');

      // 8. Generate summary
      console.log('📝 Generating summary...');
      let summaryResult;
      try {
        summaryResult = await generateVideoSummary(urlData.publicUrl, transcript);
      } catch (err) {
        const error = err as UploadError;
        error.stage = 'summary';
        throw error;
      }
      summaryResult.transcript = transcript;
      console.log('✅ Summary generated');

      // 9. Generate PDF
      console.log('📄 Generating PDF report...');
      try {
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              summary: summaryResult.summary,
              transcript: transcript || 'No transcript available',
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

        const pdfBlob = await response.blob();
        console.log('✅ PDF blob received, size:', pdfBlob.size, 'type:', pdfBlob.type);
        const reportUrl = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = reportUrl;
        a.download = 'ProofAI_Report.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(reportUrl);
        console.log('✅ PDF report downloaded successfully.');
      } catch (err) {
        const error = err as UploadError;
        console.error('❌ PDF generation failed:', err);
        error.stage = 'pdf';
        throw error;
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
}

