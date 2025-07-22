// lib/uploadRecording.ts
import { getAddressFromCoordinates } from "@/utils/geocodeAddress";
import { TranscriptionService } from '../services/transcriptionService';
import { GPTService } from '../services/gptService';
import supabase from './supabase';
import { ClientPDFService } from '../services/clientPdfService';
import { formatSummary } from '../utils/formatSummary';
import { canUserRecord, updateUsage } from '@/lib/stripe/plans';

interface UploadError extends Error {
  stage?: 'auth' | 'blob' | 'storage' | 'url' | 'database' | 'pdf';
  details?: unknown;
}

async function generatePdfWithRetry(
  data: {
    summary: any;
    transcript: string;
    originalTranscript?: string;
    languageDetected: string;
    location: string;
  },
  maxRetries = 3
): Promise<string> {
  let retryCount = 0;
  const retryDelay = 2000;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `📄 Generating PDF${retryCount > 0 ? ` (attempt ${retryCount + 1}/${maxRetries})` : ''}...`
      );

      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }

      let videoUrl = 'https://proof.ai/evidence';
      
      if (data.summary && typeof data.summary === 'object' && data.summary.videoUrl) {
        videoUrl = data.summary.videoUrl;
        console.log('🔗 Using provided video URL for PDF:', videoUrl);
      } else if (data.summary?.caseId) {
        videoUrl = `https://proof.ai/evidence/case/${data.summary.caseId}`;
        console.warn('⚠️ No video URL found in summary, using case-specific fallback URL:', videoUrl);
      } else {
        console.warn('⚠️ No video URL or case ID found, using default URL:', videoUrl);
      }

      const formattedSummaryText = formatSummary(data.summary);

      // ✅ Include transcript fields in summary object
      const summaryObj = {
        ...data.summary,
        summary: formattedSummaryText,
        videoUrl: videoUrl,
        caseId: data.summary.caseId || `CASE-${Date.now()}`,
        reportDate: data.summary.reportDate || new Date().toISOString(),
        location: data.location || 'Unknown Location',
        translatedTranscript: data.transcript || '',
        originalTranscript: data.originalTranscript || '',
      };

      console.log('✅ Created summary object with video URL and transcripts:', {
        hasVideoUrl: !!summaryObj.videoUrl,
        caseId: summaryObj.caseId,
        translatedTranscriptLength: summaryObj.translatedTranscript?.length,
        originalTranscriptLength: summaryObj.originalTranscript?.length,
      });

      let userId = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData?.session?.user?.id || null;
        console.log('🔑 Got user ID for PDF upload:', userId ? `${userId.substring(0, 8)}...` : 'No user ID');
      } catch (sessionError) {
        console.warn('⚠️ Could not get user session for PDF:', sessionError);
      }

      const pdfPath = await ClientPDFService.generatePDFReport(
        summaryObj,
        {
          watermark: false,
          confidential: true,
          includeSignature: true,
          includeTimestamps: true,
          includeFooter: true,
        },
        userId
      );

      const isSupabaseUrl = pdfPath.includes('supabase.co') || pdfPath.includes('supabase.in');
      const isBlobUrl = pdfPath.startsWith('blob:');

      console.log('🔄 PDF Result Type:', {
        isSupabaseUrl,
        isBlobUrl,
        pdfPath: pdfPath.substring(0, 50) + '...',
        hasUserId: !!userId,
      });

      return pdfPath;
    } catch (error) {
      retryCount++;
      console.error(`❌ PDF generation attempt ${retryCount} failed:`, error);

      if (retryCount === maxRetries) {
        console.error('❌ Failed to generate PDF after all retries');
        throw error;
      }
    }
  }
  throw new Error('PDF generation failed');
}

interface UploadResult {
  transcript: string;
  rawTranscript?: string;
  text?: string;
  translatedTranscript: string;
  pdfResult: string;
  detectedLanguage: string;
  language?: string;
  reportUrl: string;
}

export async function uploadRecording(audioBlob: Blob, location: string): Promise<UploadResult> {
  console.group('📹 Upload Recording Process');

  // Hoist all variables at the top
  let filename = '';
  let recordingDuration = 0;
  let transcript = '';
  let rawTranscript = '';
  let detectedLanguage = '';
  let language = '';
  let translatedTranscript = '';
  let languageDetected = '';
  let summary: any = null;

  try {
    console.log('🔍 Validating recording blob...');
    if (!audioBlob || audioBlob.size === 0) {
      const err = new Error('No recording data available') as UploadError;
      err.stage = 'blob';
      throw err;
    }
    console.log('✅ Blob valid:', {
      type: audioBlob.type,
      size: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
    });

    console.log('🔐 Getting authenticated user...');
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? 'dev-user';
    const userEmail = userData?.user?.email ?? 'dev-user';
    console.log('✅ Authenticated as:', userEmail, '(ID:', userId, ')');

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    filename = `${userId}/${timestamp}-recording.webm`;
    console.log('📝 Preparing upload:', { filename, location });

    try {
      recordingDuration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        const recordingUrl = URL.createObjectURL(audioBlob);
        audio.src = recordingUrl;
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(recordingUrl);
          resolve(audio.duration);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(recordingUrl);
          reject(new Error('Failed to load audio metadata'));
        };
      });
    } catch (error) {
      console.warn('Failed to get recording duration:', error);
    }

    const bucketName = 'recordings';
    console.log('⬆️ Uploading to Supabase storage bucket:', bucketName);
    const { data: storageData, error: storageError } = await supabase.storage
      .from(bucketName)
      .upload(filename, audioBlob, {
        contentType: 'video/webm',
        duplex: 'half',
        upsert: false,
      });

    if (storageError || !storageData?.path) {
      console.error('❌ Storage error:', storageError);
      const err = new Error(`Storage upload failed: ${storageError?.message || 'No path returned'}`) as UploadError;
      err.stage = 'storage';
      err.details = storageError;
      throw err;
    }
    console.log('✅ Upload successful:', storageData.path);

    console.log('⌛ Wait 2 seconds for storage replication...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('🔗 Getting signed URL...');
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storageData.path, 3600);

    if (urlError || !urlData?.signedUrl) {
      console.error('❌ Failed to get signed URL:', urlError);
      const err = new Error(urlError?.message || 'Failed to generate download URL') as UploadError;
      err.stage = 'url';
      err.details = urlError;
      throw err;
    }

    const signedUrl = urlData.signedUrl;
    console.log('✅ Signed URL generated:', signedUrl);

    // Check if user can record based on their plan
    const { canProceed, error: planError } = await canUserRecord(userId, recordingDuration);
    
    if (!canProceed) {
      console.error('❌ Plan validation failed:', planError);
      throw new Error(planError || 'Your current plan does not allow this recording.');
    }
    
    console.log('✅ Plan validation passed');

    const transcriptionService = await TranscriptionService.getInstance();
    console.log('🎙️ Starting transcription using signed URL instead of blob to bypass size limits');
    
    try {
      const transcriptionResult = await transcriptionService.transcribe(signedUrl);
      transcript = transcriptionResult.text || '';
      rawTranscript =
        transcriptionResult.rawTranscript || transcriptionResult.transcript || '';
      detectedLanguage = transcriptionResult.detectedLanguage || transcriptionResult.language || '';
      language = transcriptionResult.language || detectedLanguage;

      // Update usage after successful transcription
      await updateUsage(userId, recordingDuration);

      console.log('🎙️ Whisper Transcript:', {
        transcriptLength: transcript.length,
        rawTranscriptLength: rawTranscript.length,
        language: language || 'unknown',
        detectedLanguage: detectedLanguage || 'unknown',
      });

      languageDetected = await GPTService.detectLanguageWithGPT(transcript);
      console.log('🌐 Language Detected:', languageDetected);

      translatedTranscript = languageDetected === 'en'
        ? transcript
        : await GPTService.translateTranscriptWithGPT(transcript, 'English');

      console.log('🌐 Translated Transcript:', translatedTranscript);
    } catch (error) {
      console.error('❌ Transcription failed:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }

    const summary = await GPTService.generateLegalSummary(translatedTranscript);
    console.log('📝 Summary generated');

    // ✅ Geocode location
    if (typeof window !== 'undefined' && navigator.geolocation) {
      if (typeof summary === 'object' && summary !== null) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              try {
                console.log('🌎 Requesting geocode for:', latitude, longitude);
                const res = await fetch('/api/geocode', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lat: latitude, lng: longitude }),
                });
                const data = await res.json();
                console.log('🌎 Geocode API response:', data);
                const { address } = data;
                summary.location = address;
              } catch (err) {
                console.error('❌ Geocoding failed:', err);
                summary.location = `Lat: ${latitude}, Lng: ${longitude}`;
              }
              resolve();
            },
            (err) => {
              console.warn('Location unavailable:', err.message);
              summary.location = 'Location not available';
              resolve();
            }
          );
        });
      }
    }

    console.log('📹 Creating signed URL for video recording...');
    let videoUrl = 'https://proof.ai/evidence';
    
    try {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storageData.path, 60 * 60 * 24 * 7); // 7 days expiration

      if (signedUrlError) {
        console.error('❌ Failed to generate signed video URL:', signedUrlError);
        // Fallback to public URL if signed URL fails
        const { data: publicUrl } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storageData.path);
        
        if (publicUrl) {
          videoUrl = publicUrl.publicUrl;
          console.log('✅ Using public URL for video:', videoUrl);
        } else {
          console.warn('⚠️ Could not generate any video URL, using default');
        }
      } else {
        videoUrl = signedUrlData.signedUrl;
        console.log('✅ Generated signed video URL:', videoUrl);
      }
    } catch (err) {
      console.error('❌ Error generating video URL:', err);
    }
    
    // Store the video URL in the summary
    summary.videoUrl = videoUrl;

    // ✅ Use geocoded location from summary if available
    const pdfResult = await generatePdfWithRetry({
      summary,
      transcript: translatedTranscript,
      originalTranscript: languageDetected !== 'en' ? transcript : undefined,
      languageDetected,
      location: summary.location || location || 'Unknown Location',
    });

    // 🚀 Build the payload with video URL in record_url
    const payload = {
      title: `Proof Report – ${new Date().toLocaleString()}`,
      file_url: pdfResult,                  // PDF public URL
      pdf_url: pdfResult,                   // also store as pdf_url for clarity
      record_url: summary.videoUrl || null, // Store video URL in record_url
      user_id: userId,                      // matches user_id column
      summary: summary?.summary || 'No summary provided',
      transcript: rawTranscript || transcript || '',
      translated_transcript: translatedTranscript || '',
      original_transcript: transcript || '',
      language_detected: languageDetected || '',
      location: summary.location || location || 'Unknown Location',
      created_at: new Date().toISOString()
    };

    console.log('🧾 Payload to Supabase:', JSON.stringify(payload, null, 2));

    // 🔥 Insert the payload into Supabase reports table
    const { data: insertedData, error: dbError } = await supabase
      .from('reports')
      .insert(payload)
      .select()
      .single();

    if (dbError || !insertedData) {
      console.error('❌ Supabase insert error:', dbError?.message || 'No data returned');
      const err = new Error(dbError?.message || 'Failed to save report to database') as UploadError;
      err.stage = 'database';
      err.details = dbError || 'No data returned from insert';
      throw err;
    }

    console.log('✅ Report saved to Supabase with ID:', insertedData.id);
    console.log('💾 Saved to Supabase with full transcript intelligence.');
    console.log('✅ PDF URL received:', pdfResult.substring(0, 50) + '...');

    // 📊 Log usage silently (non-blocking)
    if (recordingDuration > 0) {
      console.log('📊 Logging usage:', { duration: Math.ceil(recordingDuration) });
      supabase.from('usage').insert({
        user_id: userId,
        duration_seconds: Math.ceil(recordingDuration),
      })
      .then(({ error }) => {
        if (error) {
          console.error('⚠️ Failed to log usage:', error);
        } else {
          console.log('✅ Usage logged successfully');
        }
        return null;
      })
      .catch((err) => {
        console.error('Error logging usage:', err);
      });
    }

    // 📋 Fetch plan for debugging/logging (non-blocking)
    const fetchPlanInfo = async () => {
      try {
        const { data: planRow } = await supabase
          .from('user_plans')
          .select('plan, whisper_minutes_used, whisper_minutes_limit')
          .eq('user_id', userId)
          .single();
          
        console.log('📋 Current plan:', planRow?.plan || 'starter', {
          used: planRow?.whisper_minutes_used,
          limit: planRow?.whisper_minutes_limit,
        });
      } catch (err) {
        console.warn('⚠️ Could not fetch plan info:', err);
      }
    };
    
    fetchPlanInfo().catch(console.error);

    console.log('💾 Saved to Supabase with full transcript intelligence.');
    console.log('✅ PDF URL received:', pdfResult.substring(0, 50) + '...');

    const isSupabaseUrl = pdfResult.includes('supabase.co') || pdfResult.includes('supabase.in');
    const isBlobUrl = pdfResult.startsWith('blob:');

    console.log('📊 PDF Result Analysis:', {
      isSupabaseUrl,
      isBlobUrl,
      hasUserId: !!userId,
      urlType: isSupabaseUrl ? 'Supabase Storage URL' : isBlobUrl ? 'Local Blob URL' : 'Other URL',
    });

    const finalUrl = pdfResult || '';
    console.log('📄 Returning PDF URL:', finalUrl.substring(0, 50) + '...');

    return {
      transcript: rawTranscript || transcript,
      rawTranscript: rawTranscript || transcript,
      text: transcript,
      translatedTranscript,
      pdfResult: finalUrl,
      detectedLanguage: languageDetected,
      language,
      reportUrl: finalUrl,
    } as UploadResult;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    const uploadError = error as UploadError;
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
    } else if (uploadError.stage === 'pdf') {
      throw new Error('Failed to generate PDF. Please try again.');
    } else {
      throw new Error(
        `Upload failed during ${uploadError.stage || 'process'}: ${
          typeof uploadError.message === 'string'
            ? uploadError.message
            : JSON.stringify(uploadError.message)
        }`
      );
    }
  }
}
