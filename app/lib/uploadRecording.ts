// lib/uploadRecording.ts
import { getAddressFromCoordinates } from "@/utils/geocodeAddress";
import { TranscriptionService, TranscriptionResult } from '../services/transcriptionService';
import { GPTService } from '../services/gptService';
import { supabase } from './supabase';
import { ClientPDFService } from '../services/clientPdfService';
import { formatSummary } from '../utils/formatSummary';
import { PdfGenerationRequest } from '../types/pdf';

interface UploadError extends Error {
  stage?: 'auth' | 'blob' | 'storage' | 'url' | 'database' | 'pdf';
  details?: unknown;
}

async function generatePdfWithRetry(data: {
  summary: any;
  transcript: string;
  originalTranscript?: string;
  languageDetected: string;
  location: string;
}, maxRetries = 3): Promise<string> {
  let retryCount = 0;
  const retryDelay = 2000; // 2 seconds

  while (retryCount < maxRetries) {
    try {
      console.log(`📄 Generating PDF${retryCount > 0 ? ` (attempt ${retryCount + 1}/${maxRetries})` : ''}...`);
      
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      // CRITICAL FIX: Save video URL before formatting potentially removes it
      // Extract from summary if it exists
      const videoUrl = data.summary && typeof data.summary === 'object' && data.summary.videoUrl ? 
        data.summary.videoUrl : 'https://proof.ai/evidence';
      
      console.log('🔗 USING VIDEO URL FOR PDF:', videoUrl);
      
      // Format the summary as usual
      const formattedSummary = formatSummary(data.summary);
      
      // RADICAL FIX: Force videoUrl into formatted summary 
      if (typeof formattedSummary === 'object') {
        formattedSummary.videoUrl = videoUrl;
        console.log('✅ Injected video URL directly into formatted summary');
      }
      
      // Create the request object for PDF generation with the videoUrl
      // integrated at every possible level to ensure it makes it through
      const pdfPath = await ClientPDFService.generatePDFReport({
        summary: formattedSummary,
        transcript: data.transcript,
        originalTranscript: data.originalTranscript || '',
        language: data.languageDetected,
        location: data.location,
        caseId: `CASE-${Date.now()}`,
        reportDate: new Date().toISOString(),
        // RADICAL FIX: Add videoUrl at top level too
        videoUrl: videoUrl 
      }, {
        watermark: false,
        confidential: true,
        includeSignature: true,
        includeTimestamps: true,
        includeFooter: true,
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
  translatedTranscript: string;
  pdfResult: string;
  detectedLanguage: string;
  reportUrl: string;
}

export async function uploadRecording(audioBlob: Blob, location: string): Promise<UploadResult> {
  console.group('📹 Upload Recording Process');
  
  let filename = '';
  let recordingDuration = 0;
  
  try {
    // 1. Validate blob
    console.log('🔍 Validating recording blob...');
    if (!audioBlob || audioBlob.size === 0) {
      const err = new Error('No recording data available') as UploadError;
      err.stage = 'blob';
      throw err;
    }
    console.log('✅ Blob valid:', {
      type: audioBlob.type,
      size: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`
    });

    // 2. (DEV ONLY) Bypass authentication
    console.log('🔐 [DEV] Bypassing authentication for upload...');
    const session = { user: { id: 'dev-user', email: 'dev@example.com' } };
    console.log('✅ [DEV] Faked authentication as:', session.user.email);

    // 3. Generate filename
    const userId = session.user.id;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    filename = `${userId}/${timestamp}-recording.webm`;
    console.log('📝 Preparing upload:', { filename, location });

    // Get recording duration
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
      // Continue with duration as 0
    }

    // 4. Upload to storage
    console.log('⬆️ Uploading to Supabase storage...');
    const { data: storageData, error: storageError } = await supabase.storage
      .from('recordings')
      .upload(filename, audioBlob, {
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

    // 5. Get signed URL
    console.log('🔗 Getting signed URL...');
    const { data: urlData, error: urlError } = await supabase.storage
      .from('recordings')
      .createSignedUrl(filename, 3600); // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      console.error('❌ Failed to get signed URL:', urlError);
      const err = new Error(
        urlError?.message || 'Failed to generate download URL'
      ) as UploadError;
      err.stage = 'url';
      err.details = urlError;
      throw err;
    }

    const signedUrl = urlData.signedUrl;
    console.log('✅ Signed URL generated:', signedUrl);

    if (!signedUrl) {
      const err = new Error('Generated URL is undefined') as UploadError;
      err.stage = 'url';
      throw err;
    }

    // 6. Get transcript from Whisper API
    const transcriptionService = await TranscriptionService.getInstance();
    const transcriptionResult = await transcriptionService.transcribe(audioBlob);
    const transcript = transcriptionResult.text;
    console.log('🎙️ Whisper Transcript:', transcript);

    // 7. Detect Language
    const languageDetected = await GPTService.detectLanguageWithGPT(transcript);
    console.log('🌐 Language Detected:', languageDetected);

    // 8. Translate if not English
    const translatedTranscript = languageDetected === 'en'
      ? transcript
      : await GPTService.translateTranscriptWithGPT(transcript, 'English');

    console.log('🌐 Translated Transcript:', translatedTranscript);

    // 9. Generate summary using translated transcript
    const summary = await GPTService.generateLegalSummary(translatedTranscript);
    console.log('📝 Summary generated');

    // --- Attach browser geolocation to summary (formatSummary compatible) ---
    if (typeof window !== 'undefined' && navigator.geolocation) {
      if (typeof summary === 'object' && summary !== null) {
        await new Promise<void>(resolve => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              try {
                console.log("🌎 Requesting geocode for:", latitude, longitude);
                const res = await fetch("/api/geocode", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ lat: latitude, lng: longitude }),
                });
                const data = await res.json();
                console.log("🌎 Geocode API response:", data);
                const { address } = data;
                summary.location = address;
              } catch (err) {
                console.error("❌ Geocoding failed:", err);
                summary.location = `Lat: ${latitude}, Lng: ${longitude}`; // fallback
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
      } else {
        console.warn('⚠️ Summary is not an object:', summary);
      }
    }

    // 10. Generate signed URL for the recording video
    console.log('📹 Creating signed URL for video recording...');
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('recordings')
      .createSignedUrl(filename, 60 * 60 * 24 * 7); // Valid for 7 days

    if (signedUrlError) {
      console.error("❌ Failed to generate signed video URL:", signedUrlError);
      // Set a fallback URL
      summary.videoUrl = "https://proof.ai/evidence";
    } else {
      // Inject the signed URL into the summary object
      summary.videoUrl = signedUrlData.signedUrl;
      console.log('✅ Generated signed video URL:', summary.videoUrl);
    }

    // 11. Generate PDF with retry
    const pdfResult = await generatePdfWithRetry({
      summary,
      transcript: translatedTranscript,
      originalTranscript: languageDetected !== 'en' ? transcript : undefined,
      languageDetected,
      location,
    });

    // 11. Save to Supabase
    const payload = {
      file_url: signedUrl, // matches the DB schema
      summary,
      original_transcript: transcript,
      translated_transcript: translatedTranscript,
      language_detected: languageDetected,
      location,
      created_at: new Date().toISOString()
    };

    console.log('🧾 Payload to Supabase:', payload);

    const { data, error: dbError } = await supabase.from('recordings').insert(payload);

    if (dbError) {
      console.error('❌ Supabase insert error:', dbError.message);
      const err = new Error('Failed to save recording to database') as UploadError;
      err.stage = 'database';
      err.details = dbError;
      throw err;
    }

    console.log('💾 Saved to Supabase with full transcript intelligence.');

    // Get the public URL for the PDF from reports bucket
    let pdfFilename = pdfResult;
    // If pdfResult is a URL, extract just the filename
    if (pdfResult.startsWith('http')) {
      pdfFilename = pdfResult.split('/').pop() || pdfResult;
    }
    const { data: publicUrl } = supabase.storage
      .from('reports')
      .getPublicUrl(pdfFilename);

    if (!publicUrl?.publicUrl) {
      console.error('❌ Failed to get PDF public URL');
      const err = new Error('Failed to get PDF public URL') as UploadError;
      err.stage = 'pdf';
      throw err;
    }

    console.log('✅ PDF public URL:', publicUrl.publicUrl);

    const finalUrl = publicUrl?.publicUrl || '';
    console.log('📄 Returning PDF URL:', finalUrl);

    return {
      transcript,
      translatedTranscript,
      pdfResult: finalUrl, // Use the full URL as pdfResult
      detectedLanguage: languageDetected,
      reportUrl: finalUrl
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
        `Upload failed during ${uploadError.stage || 'process'}: ${uploadError.message}`
      );
    }
  }
}
