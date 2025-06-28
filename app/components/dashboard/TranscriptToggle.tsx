'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptToggleProps {
  original: string;
  translated: string;
}

export default function TranscriptToggle({ original, translated }: TranscriptToggleProps) {
  const [showOriginal, setShowOriginal] = useState(true);
  
  // Don't render if both transcripts are not available
  if (!original && !translated) return null;
  
  // If one transcript is missing, just show the available one without a toggle
  if (!original || !translated) {
    const availableTranscript = original || translated;
    return (
      <div className="mt-2">
        <p className="text-sm text-gray-600 font-medium">Transcript:</p>
        <p className="text-sm mt-1 text-gray-700">{availableTranscript}</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">
          {showOriginal ? 'Original Transcript:' : 'Translated Transcript:'}
        </p>
        <motion.button
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          onClick={() => setShowOriginal(!showOriginal)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View {showOriginal ? 'Translated' : 'Original'}
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        <motion.p 
          key={showOriginal ? 'original' : 'translated'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="text-sm mt-1 text-gray-700 p-2 bg-gray-50 rounded border border-gray-100"
        >
          {showOriginal ? original : translated}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
