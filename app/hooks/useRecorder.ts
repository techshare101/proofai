import { useRef, useState, useEffect, useCallback } from 'react';
import { uploadRecording } from '../lib/uploadRecording';
import { toast } from 'react-hot-toast';

type RecorderStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'uploading' | 'error' | 'size-error';

interface UseRecorderOptions {
  onUploadSuccess: (url: string) => void;
  location: string;
  userId?: string;
  maxFileSizeMB?: number; // Maximum file size in MB
}

export function useRecorder({ onUploadSuccess, location, userId, maxFileSizeMB = 25 }: UseRecorderOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string>('');

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      // Only initialize if not already initialized
      if (!streamRef.current) {
        setStatus('requesting');
        setError('');

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });

        // Store references
        streamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);

        // Set up video preview
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.error('Video play error:', playError);
          }
        }
      }

      // Set up MediaRecorder event handlers
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          chunksRef.current = []; // Clear chunks
          
          // Check file size
          const fileSizeMB = blob.size / (1024 * 1024);
          console.log(`📊 Recording size: ${fileSizeMB.toFixed(2)} MB (max: ${maxFileSizeMB} MB)`);
          
          if (fileSizeMB > maxFileSizeMB) {
            console.error(`❌ Recording too large: ${fileSizeMB.toFixed(2)} MB exceeds ${maxFileSizeMB} MB limit`);
            setError(`Recording too large (${fileSizeMB.toFixed(1)} MB). Please try a shorter recording (max: ${maxFileSizeMB} MB).`);
            setStatus('size-error');
            toast.error(`Recording too large (${fileSizeMB.toFixed(1)} MB). Please try a shorter recording.`);
            return;
          }

          setStatus('uploading');
          console.log('📹 Processing recording...');
          const result = await uploadRecording(blob, location);
          console.log('✅ Upload successful!');
          onUploadSuccess(result.reportUrl);
        } catch (err) {
          console.error('❌ Upload error:', err);
          setError(err instanceof Error ? err.message : 'Failed to upload video');
          setStatus('error');
        }
      };

      setStatus('ready');
    } catch (err) {
      console.error('❌ Camera access error:', err);
      setError(err instanceof Error ? err.message : 'Could not access camera/microphone');
      setStatus('error');
    }
  }, [location, onUploadSuccess]);

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await initCamera();
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [initCamera]);

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'inactive') {
      try {
        mediaRecorderRef.current.start();
        setStatus('recording');
        setError('');
      } catch (err) {
        console.error('❌ Start recording error:', err);
        setError('Could not start recording');
        setStatus('error');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  const retryCamera = useCallback(async () => {
    // Clean up existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Reinitialize
    await initCamera();
  }, [initCamera]);

  return {
    videoRef,
    status,
    error,
    startRecording,
    stopRecording,
    retryCamera
  };
}
