'use client'

import React, { useEffect, useRef, useState } from 'react'
import { TranscriptionService } from '../services/transcriptionService'
import { useRouter } from 'next/navigation'
import { uploadRecording } from '@/lib/uploadRecording';
import { useAuth } from '../contexts/AuthContext';
import { useRecorder } from '../hooks/useRecorder';
import { toast } from 'react-hot-toast';

type RecorderStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'uploading' | 'error';

const StatusMessage = ({ status, error }: { status: RecorderStatus; error?: string }) => {
  const messages: Record<RecorderStatus, string> = {
    idle: 'Initializing camera...',
    requesting: 'Requesting camera access...',
    ready: 'Ready to record',
    recording: 'Recording in progress...',
    uploading: 'Uploading video...',
    error: error || 'An error occurred'
  };

  return (
    <div className="text-center">
      <p className={status === 'error' ? 'text-red-500' : ''}>
        {messages[status]}
      </p>
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
  const [translatedText, setTranslatedText] = useState<string>('')
  const [transcript, setTranscript] = useState<string>('')
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [showDownload, setShowDownload] = useState(false)
  const chunks = useRef<Blob[]>([])
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    if (!videoRef.current) return;

    const init = async () => {
      if (!mounted) return;
      try {
        await initializeCamera();
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++;
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(init, retryDelay);
        } else {
          setError('Failed to initialize camera after multiple attempts.');
        }
      }
    };

    setTimeout(() => {
      if (mounted && videoRef.current) init();
    }, 100);

    return () => {
      mounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      cleanupStream();
    };
  }, [videoRef.current]);

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

    if (mediaRecorder?.state !== 'inactive') mediaRecorder.stop();
    setMediaRecorder(null);
    setRecording(false);
    setStatus('idle');
    setError('');
  };

  const startRecording = async () => {
    if (!streamRef.current) await initializeCamera();
    if (!streamRef.current) return;

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    chunks.current = [];

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = async () => {
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
        <StatusMessage status={status} error={error} />

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
