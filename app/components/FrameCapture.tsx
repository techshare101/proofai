'use client';

import { useRef, useState } from 'react';
import { FrameService } from '../services/frameService';

interface FrameCaptureProps {
  onFrameCaptured?: (frameUrl: string) => void;
}

export default function FrameCapture({ onFrameCaptured }: FrameCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    try {
      setIsCapturing(true);
      setError('');

      // Extract frame
      const frameDataUrl = await FrameService.extractFrame(videoRef.current);
      
      // Upload to Supabase and get public URL
      const publicUrl = await FrameService.uploadFrame(frameDataUrl);
      
      onFrameCaptured?.(publicUrl);
    } catch (err) {
      setError('Failed to capture frame. Please try again.');
      console.error('Frame capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="flex flex-col items-center gap-4">
        <video 
          ref={videoRef}
          controls
          className="w-full rounded-lg shadow-lg"
        />
        
        <label 
          htmlFor="video-input"
          className="w-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-center"
        >
          Select Video
          <input
            id="video-input"
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        <button
          onClick={captureFrame}
          disabled={isCapturing || !videoRef.current?.src}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCapturing ? 'Capturing...' : 'Capture Frame'}
        </button>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
