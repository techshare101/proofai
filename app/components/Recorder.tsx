'use client'

import React, { useEffect, useRef, useState } from 'react'
import { TranscriptionService } from '../services/transcriptionService'
import { useRouter } from 'next/navigation'
import { uploadRecording } from '@/lib/uploadRecording';
import { useAuth } from '../contexts/AuthContext';
import { useRecorder } from '../hooks/useRecorder';
import { toast } from 'react-hot-toast';

type RecorderStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'uploading' | 'error';

const StatusMessage = ({ status, error, recordingTime }: { status: RecorderStatus; error?: string; recordingTime?: number }) => {
  // Format seconds to MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

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
      
      {recordingTime !== undefined && status === 'recording' && (
        <div className="text-lg font-bold text-center mt-2">
          Recording Time: {formatTime(recordingTime)}
        </div>
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
  
  // Recording time tracking
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimer = useRef<NodeJS.Timeout | null>(null)
  // Remove fixed time limit to allow extended recording
  // Browser memory limits will naturally constrain maximum recording time

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    const init = async () => {
      if (!mounted) return;
      try {
        await initializeCamera();
      } catch (err) {
        console.warn('Camera initialization error:', err);
        if (retryCount < maxRetries) {
          retryCount++;
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(init, retryDelay);
        } else {
          setError('Failed to initialize camera after multiple attempts.');
          setStatus('error');
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (mounted) init();
    }, 100);

    return () => {
      mounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      clearTimeout(timer);
      cleanupStream();
    };
  }, []);

  const initializeCamera = async () => {
    setStatus('requesting');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera not supported');

    cleanupStream();
    await new Promise(res => setTimeout(res, 500));
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    if (!videoDevices.length) throw new Error('No camera devices found');

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
        videoRef.current.onloadedmetadata = () => videoRef.current?.play().then(resolve).catch(reject);
        videoRef.current.onerror = reject;
      });
    }

    setError('');
    setStatus('ready');
  };

  const cleanupStream = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          streamRef.current?.removeTrack(track);
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }

      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch (err) {
      console.warn('Error cleaning up stream:', err);
    }

    setMediaRecorder(null);
    setRecording(false);
    setStatus('idle');
    setError('');
  };

  const startRecording = async () => {
    const stream = streamRef.current;
    if (!stream) {
      setError('Camera not initialized');
      return;
    }

    try {
      // Reset recording time
      setRecordingTime(0);
      
      // Setup recording timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      
      // Set up a timer to track recording duration without enforcing a limit
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

      setStatus('recording');
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      chunks.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Clear the recording timer when recording stops
        if (recordingTimer.current) {
          clearInterval(recordingTimer.current);
          recordingTimer.current = null;
        }
        
        setStatus('uploading');
        const blob = new Blob(chunks.current, { type: 'video/webm' });

        let location = 'Unknown Location';
        try {
          if ('geolocation' in navigator) {
            const position = await new Promise<GeolocationPosition>((res, rej) =>
              navigator.geolocation.getCurrentPosition(res, rej)
            );
            const key = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
            if (key) {
              const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=${key}`
              );
              const data = await response.json();
              if (data?.results?.length > 0) {
                location = data.results[0].formatted;
              }
            }
          }
        } catch (e) {
          console.warn('Geolocation failed:', e);
        }

        const result = await uploadRecording(blob, location);
        setDetectedLanguage(result.detectedLanguage || '');
        setTranscript(result.transcript || '');
        setTranslatedText(result.translatedTranscript || '');

        // Check if not English and translation was enabled
        if (result.detectedLanguage && 
            result.detectedLanguage !== 'en' && 
            offerTranslation && 
            !isTranslating) {
          setIsTranslating(true);
        }

        if (result.reportUrl) {
          setReportUrl(result.reportUrl);
          setShowDownload(true);
          toast.success('Report ready!');
        }

        setStatus('ready');
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setRecording(true);
      setError('');
    } catch (e) {
      console.error('Recording error:', e);
      setError(`Recording error: ${e instanceof Error ? e.message : String(e)}`);
      setStatus('error');
      
      // Clear the recording timer on error
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
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
        <StatusMessage status={status} error={error} recordingTime={recording ? recordingTime : undefined} />

        {/* Advanced Settings Button */}
        <div className="mt-2">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            {showAdvanced ? (
              <>
                <span>Hide Advanced Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-up" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
                </svg>
              </>
            ) : (
              <>
                <span>Show Advanced Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Advanced Settings Section */}
        {showAdvanced && (
          <div className="w-full max-w-md p-4 bg-gray-50 rounded-lg border shadow-sm">
            <div className="mb-4">
              <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Language (leave empty for auto-detect)
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Auto-detect</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="ru">Russian</option>
                <option value="pt">Portuguese</option>
                <option value="it">Italian</option>
              </select>
            </div>
            
            {detectedLanguage && language === '' && (
              <div className="mb-4">
                <span className="text-sm text-gray-700">Detected language: <span className="font-semibold">{detectedLanguage}</span></span>
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <input
                id="translation-checkbox"
                type="checkbox"
                checked={offerTranslation}
                onChange={(e) => setOfferTranslation(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="translation-checkbox" className="ml-2 text-sm font-medium text-gray-700">
                Offer translation to English (if not in English)
              </label>
            </div>

            {isTranslating && detectedLanguage && detectedLanguage !== 'en' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">We detected that your recording is in {detectedLanguage}. Would you like to translate it to English?</p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => setIsTranslating(false)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    No, Thanks
                  </button>
                  <button
                    onClick={() => {
                      // Here you would trigger translation
                      // For now just mark as not translating
                      setIsTranslating(false);
                      toast('Translation functionality would be triggered here');
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Yes, Translate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

        {showDownload && reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
          >
            📄 Download Report
          </a>
        )}
      </div>
    </div>
  );
}
