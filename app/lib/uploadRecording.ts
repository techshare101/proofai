// lib/uploadRecording.ts
import { getAddressFromCoordinates } from "@/utils/geocodeAddress";
import { TranscriptionService, TranscriptionResult } from '../services/transcriptionService';
import { GPTService } from '../services/gptService';
import supabase from './supabase';
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

      // Format and store the summary for use in the PDF
      // Note: No need to save as separate file

      // RADICAL FIX: Force videoUrl into formatted summary 
      if (typeof formattedSummary === 'object' && formattedSummary !== null) {
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
  rawTranscript?: string; // Raw transcript field (same as transcript)
  text?: string; // Additional field from Whisper API
  translatedTranscript: string;
  pdfResult: string;
  detectedLanguage: string;
  language?: string; // Direct language field from Whisper API
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

    // 2. Get authenticated user or use dev fallback
    console.log('🔐 Getting authenticated user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // Use user ID as identifier (required by Supabase RLS policies) or fallback to dev-user
    const userId = userData?.user?.id ?? 'dev-user';
    const userEmail = userData?.user?.email ?? 'dev-user'; // Keep for logging
    console.log('✅ Authenticated as:', userEmail, '(ID:', userId, ')');

    // 3. Generate filename
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    // Don't add 'reports/' prefix - the bucket name is already 'reports'
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
    const bucketName = 'recordings';
    console.log('⬆️ Uploading to Supabase storage bucket:', bucketName);
    const { data: storageData, error: storageError } = await supabase.storage
      .from(bucketName)
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

    // Add a small delay to allow for replication across Supabase storage
    console.log('⌛ Wait 2 seconds for storage replication...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

    // 5. Get signed URL
    console.log('🔗 Getting signed URL...');
    // FIXED: Use the actual path returned by Supabase instead of local filename
    console.log('📦 Generating signed URL from bucket:', bucketName, 'for file:', storageData.path);
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storageData.path, 3600); // 1 hour expiry

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

    // 6. Get transcript from Whisper API using the signed URL
    // We'll use the signed URL to avoid uploading the large blob through the API
    const transcriptionService = await TranscriptionService.getInstance();
    console.log('🎙️ Starting transcription using signed URL instead of blob to bypass size limits');
    
    // Send the signed URL to the transcription service instead of the blob
    const transcriptionResult = await transcriptionService.transcribe(signedUrl);
    const transcript = transcriptionResult.text || '';
    const rawTranscript = transcriptionResult.rawTranscript || transcriptionResult.transcript || transcript;
    const detectedLanguage = transcriptionResult.detectedLanguage || transcriptionResult.language || '';
    const language = transcriptionResult.language || detectedLanguage;
    
    console.log('🎙️ Whisper Transcript:', {
      transcriptLength: transcript.length,
      rawTranscriptLength: rawTranscript.length,
      language: language || 'unknown',
      detectedLanguage: detectedLanguage || 'unknown'
    });

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
    console.log('📦 Generating long-term signed URL from bucket:', bucketName, 'for file:', storageData.path);
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(storageData.path, 60 * 60 * 24 * 7); // Valid for 7 days

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
      title: `Proof Report – ${new Date().toLocaleString()}`, // Add default title
      file_url: signedUrl, // matches the DB schema
      summary,
      original_transcript: transcript,
      translated_transcript: translatedTranscript,
      language_detected: languageDetected,
      location,
      created_at: new Date().toISOString(),
      user_id: userId // Add user_id for RLS policy
    };

    console.log('🧾 Payload to Supabase:', payload);

    const { data, error: dbError } = await supabase.from('reports').insert(payload).select();

    if (dbError) {
      console.error('❌ Supabase insert error:', dbError.message);
      const err = new Error('Failed to save recording to database') as UploadError;
      err.stage = 'database';
      err.details = dbError;
      throw err;
    }

    console.log('💾 Saved to Supabase with full transcript intelligence.');

    // Handle the PDF URL returned directly from ClientPDFService
    // pdfResult is now already a complete URL (object URL or direct download URL)
    console.log('✅ PDF URL received:', pdfResult);
    
    // No need to get from Supabase storage since the PDF is returned directly
    const finalUrl = pdfResult || '';
    console.log('📄 Returning PDF URL:', finalUrl);

    // Return transcript and PDF report URL with enhanced fields for non-English support
    return {
      transcript: rawTranscript || transcript, // Always use raw transcript as primary field
      rawTranscript: rawTranscript || transcript, // Explicit raw transcript field
      text: transcript, // Additional field for compatibility
      translatedTranscript,
      pdfResult: finalUrl, // Use the full URL as pdfResult
      detectedLanguage: languageDetected,
      language, // Include direct language field
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
        `Upload failed during ${uploadError.stage || 'process'}: ${
          typeof uploadError.message === 'string'
            ? uploadError.message
            : JSON.stringify(uploadError.message)
        }`
      );
    }
  }
}
