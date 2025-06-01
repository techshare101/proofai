'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { uploadRecording } from '@/lib/uploadRecording';
import { useAuth } from '../contexts/AuthContext';
import { useRecorder } from '../hooks/useRecorder';

// Types
type RecorderStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'uploading' | 'error';

// Components
const StatusMessage = ({ status, error }: { status: RecorderStatus; error?: string }) => {
  const messages: Record<RecorderStatus, string> = {
    idle: 'Initializing camera...',
    requesting: 'Requesting camera access...',
    ready: 'Ready to record',
    recording: 'Recording in progress...',
    uploading: 'Uploading video...',
    error: error || 'An error occurred'
  };

  const isError = status === 'error';
  return (
    <div className="text-center">
      {isError ? (
        <p className="text-red-500">{messages[status]}</p>
      ) : (
        <p>{messages[status]}</p>
      )}
    </div>
  );
};

export default function Recorder() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [error, setError] = useState<string>('')
  const chunks = useRef<Blob[]>([])

  // Initialize camera on mount
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (mounted) {
        await initializeCamera()
      }
    }

    init()

    // Cleanup on unmount
    return () => {
      mounted = false
      cleanupStream()
    }
  }, [])

  const initializeCamera = async () => {
    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Clean up any existing stream
      cleanupStream();

      // Start with basic constraints first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
        
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
          } catch (playError) {
            console.error('Error playing video:', playError);
            throw new Error('Failed to initialize video preview');
          }
        };
      } else {
        throw new Error('Video element not initialized');
      }
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setError('No camera found. Please connect a camera and try again.');
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
        setError('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setError(`Camera error: ${errorMessage}. Please try again.`);
      }
      console.error('Media device error:', err);
    }
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMediaRecorder(null);
    setRecording(false);
  };

  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        await initializeCamera();
      }

      if (streamRef.current) {
        const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
        chunks.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          try {
            const blob = new Blob(chunks.current, { type: 'video/webm;codecs=vp8,opus' });
            const publicUrl = await uploadRecording(blob, 'ProofAI Live');
            if (publicUrl) {
              router.push(`/summary?videoUrl=${encodeURIComponent(publicUrl)}`);
            }
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            setError('Failed to upload recording');
          }
        };

        recorder.start(1000); // Collect data every second
        setMediaRecorder(recorder);
        setRecording(true);
        setError('');
      }
    } catch (err) {
      setError('Failed to start recording');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const retryCamera = async () => {
    cleanupStream();
    await initializeCamera();
  };

  return (
    <div className="flex flex-col items-center space-y-4 mt-8">
      <div className="relative w-full max-w-lg">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg border shadow bg-gray-900"
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-white text-center p-4">
              <p className="mb-2">{error}</p>
              <button
                onClick={retryCamera}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                Retry Camera Access
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={startRecording}
          disabled={recording || !!error}
          className={`px-6 py-3 font-bold rounded transition ${recording || error
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          Start Recording
        </button>

        <button
          onClick={stopRecording}
          disabled={!recording}
          className={`px-6 py-3 font-bold rounded transition ${!recording
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'}`}
        >
          Stop Recording
        </button>
      </div>
    </div>
  );
}
