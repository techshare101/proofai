'use client';

import { useState } from 'react';
import Transcriber from './Transcriber';
import FrameCapture from './FrameCapture';
import { GPTService } from '../services/gptService';
import { PDFService } from '../services/pdfService';

interface GeneratorProps {
  caseId?: string;
  location?: string;
  userName?: string;
}

export default function LegalSummaryGenerator({ caseId, location, userName }: GeneratorProps) {
  const [transcriptText, setTranscriptText] = useState('');
  const [frameUrl, setFrameUrl] = useState('');
  const [summary, setSummary] = useState<{
    title: string;
    summary: string;
    keyParticipants: string;
    time: string;
    location: string;
    legalRelevance: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleTranscription = (text: string) => {
    console.log('📄 Received transcript:', text);
    setTranscriptText(text);
  };

  const handleFrameCapture = (url: string) => {
    setFrameUrl(url);
  };

  const generateSummary = async () => {
    if (!transcriptText) {
      setError('Please provide a transcript first');
      return;
    }

    // Ensure transcript has meaningful content
    const cleanTranscript = transcriptText.trim();
    if (cleanTranscript.length < 10) {
      setError('Transcript appears too short. Please ensure audio is captured correctly.');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      
      console.log('📤 Preparing evidence analysis:', {
        hasTranscript: !!transcriptText,
        transcriptLength: transcriptText.length,
        hasFrame: !!frameUrl,
        metadata: { caseId, location, userName }
      });
      
      const generatedSummary = await GPTService.generateLegalSummary(
        `[LEGAL RECORDING TRANSCRIPT]
Case ID: ${caseId || 'Not specified'}
Location: ${location || 'Not specified'}
Recorded by: ${userName || 'Not specified'}
Timestamp: ${new Date().toLocaleString()}

Transcript Content:
${transcriptText}`,
        frameUrl || undefined
      );
      
      console.log('📥 Received GPT summary:', generatedSummary);
      setSummary(generatedSummary);
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
      console.error('Summary generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">1. Transcribe Video</h2>
            <Transcriber onTranscriptionComplete={handleTranscription} />
            {transcriptText && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Transcript:</h3>
                <p className="text-sm">{transcriptText}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">2. Capture Frame (Optional)</h2>
            <FrameCapture onFrameCaptured={handleFrameCapture} />
            {frameUrl && (
              <div className="mt-4">
                <img src={frameUrl} alt="Captured frame" className="rounded" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">3. Generate Legal Summary</h2>
          <div className="space-y-4">
          <button
            onClick={generateSummary}
            disabled={!transcriptText || isGenerating}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Summary'}
          </button>

          {error && (
            <p className="mt-4 text-red-500 text-sm">{error}</p>
          )}

          {summary && (
            <div className="mt-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{summary.title}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Time:</span> {summary.time}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {summary.location}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Key Participants:</span> {summary.keyParticipants}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Summary:</h4>
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="whitespace-pre-wrap">{summary.summary}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Legal Relevance:</h4>
                  <div className="p-4 bg-gray-50 rounded">
                    <p className="whitespace-pre-wrap">{summary.legalRelevance}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  PDFService.generateSummaryPDF({
                    summary,
                    transcriptText,
                    frameUrl,
                    metadata: {
                      caseId,
                      userName
                    }
                  });
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
              >
                Download PDF
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
