'use client'

import React, { useEffect, useRef, useState } from 'react'
import { TranscriptionService } from '../services/transcriptionService'
import { useRouter } from 'next/navigation'
import { uploadRecording } from '@/lib/uploadRecording';
import { useAuth } from '../contexts/AuthContext';
import { useRecorder } from '../hooks/useRecorder';
import { toast } from 'react-hot-toast';

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
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [language, setLanguage] = useState('')
  const [detectedLanguage, setDetectedLanguage] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [offerTranslation, setOfferTranslation] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedText, setTranslatedText] = useState<string>('')
  const [transcript, setTranscript] = useState<string>('')
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [showDownload, setShowDownload] = useState(false)
  const chunks = useRef<Blob[]>([])
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera on mount
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const init = async () => {
      if (!mounted) return;

      try {
        await initializeCamera();
      } catch (err) {
        console.error('Camera initialization failed:', err);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying camera initialization (${retryCount}/${maxRetries})...`);
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(init, retryDelay);
        } else {
          setError('Failed to initialize camera after multiple attempts. Please refresh the page.');
        }
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      cleanupStream();
    };
  }, [])

  const initializeCamera = async () => {
    setStatus('requesting');
    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Clean up any existing stream
      cleanupStream();

      // Wait a bit after cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to enumerate devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Start with basic constraints first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          deviceId: videoDevices[0].deviceId,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
        
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject('Video element not found');
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              resolve(true);
            } catch (playError) {
              reject(playError);
            }
          };
          videoRef.current.onerror = (e) => reject(e);
        });
      } else {
        throw new Error('Video element not initialized');
      }

      setError('');
      setStatus('ready');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Camera initialization error:', err);

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setError('No camera found. Please connect a camera and try again.');
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
        setError('Camera is in use by another application. Please close other apps using the camera and refresh the page.');
        // Try to force cleanup of any stuck streams
        try {
          const allTracks = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => stream.getTracks())
            .catch(() => []);
          allTracks.forEach(track => track.stop());
        } catch {}
      } else {
        setError(`Camera error: ${errorMessage}. Please try again.`);
      }
      setStatus('error');
      throw err; // Re-throw to trigger retry logic
    }
  };

  const cleanupStream = () => {
    try {
      // Stop all tracks in the stream
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
          streamRef.current?.removeTrack(track);
        });
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Force reload
      }

      // Stop media recorder if active
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setMediaRecorder(null);
      setRecording(false);

      // Reset state
      setStatus('idle');
      setError('');
    } catch (err) {
      console.error('Error cleaning up stream:', err);
    }
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
            setStatus('uploading');
            const blob = new Blob(chunks.current, { type: 'video/webm;codecs=vp8,opus' });
            const result = await uploadRecording(blob, 'ProofAI Live');
            
            if (result.detectedLanguage) {
              setDetectedLanguage(result.detectedLanguage);
            }
            
            if (result.transcript) {
              setTranscript(result.transcript);
            }
            
            if (result.translatedTranscript) {
              setTranslatedText(result.translatedTranscript);
            }

            if (result.reportUrl) {
              setReportUrl(result.reportUrl);
              setShowDownload(true);
              toast.success('Your report is ready for download!');
            }
            
            setStatus('ready');
          } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to save recording details. Please try again.');
            setStatus('error');
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

      <div className="flex flex-col items-center space-y-4">
        {detectedLanguage && (
          <div className="mt-3 text-sm text-gray-800">
            🧠 Detected Language: <strong>{detectedLanguage}</strong>
            <button
              className="ml-2 text-blue-600 underline text-xs"
              onClick={() => setShowAdvanced(true)}
            >
              Change Language
            </button>

            {detectedLanguage !== 'en' && !translatedText && (
              <div className="mt-2">
                <label className="text-sm">Would you like an English summary?</label>
                <div>
                  <button
                    onClick={() => {
                      setOfferTranslation(true);
                      // Re-record with translation enabled
                      startRecording();
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded mt-1 mr-2"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setOfferTranslation(false)}
                    className="text-gray-600 text-sm underline"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 text-sm mt-2 underline"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced Settings'}
          </button>

          {showAdvanced && (
            <div className="flex flex-col space-y-4 w-full max-w-sm">
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">Preferred Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  disabled={recording}
                >
                  <option value="">🌐 Auto Detect</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="pt">Português</option>
                  <option value="zh">中文</option>
                  <option value="hi">हिन्दी</option>
                  <option value="ar">العربية</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>

                {detectedLanguage && language === '' && (
                  <div className="mt-1 text-sm text-gray-600">
                    Detected: {detectedLanguage}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="offerTranslation"
                  checked={offerTranslation}
                  onChange={(e) => setOfferTranslation(e.target.checked)}
                  disabled={recording}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="offerTranslation" className="text-sm text-gray-700">
                  Offer translation to English
                </label>
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

          {showDownload && reportUrl && (
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            >
              📄 Download Latest Report
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
