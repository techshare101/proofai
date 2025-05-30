'use client';

import { useState } from 'react';
import { TranscriptionService } from '../services/transcriptionService';

interface TranscriberProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function Transcriber({ onTranscriptionComplete }: TranscriberProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsTranscribing(true);
      setError('');
      
      const service = await TranscriptionService.getInstance();
      const text = await service.transcribe(file);
      
      onTranscriptionComplete(text);
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="flex flex-col items-center gap-4">
        <label 
          htmlFor="audio-input"
          className="w-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-center disabled:opacity-50"
        >
          {isTranscribing ? 'Transcribing...' : 'Select Audio File'}
          <input
            id="audio-input"
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileChange}
            disabled={isTranscribing}
            className="hidden"
          />
        </label>
        
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
