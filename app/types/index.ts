import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface ReportSummary {
  title: string;
  summary: string;
  keyParticipants: string | string[];
  time: string;
  location: string;
  legalRelevance: string;
}

export interface ReportData {
  summary: ReportSummary;
  transcriptText: string;
  frameUrl?: string;
  metadata?: {
    userName?: string;
    caseId?: string;
  };
}

export interface SummaryResult {
  success: boolean;
  summary: string;
  transcript?: string; // From Whisper transcription
  transcriptText?: string; // Legacy field
  notableQuotes: string[]; // Notable quotes from the transcript
  participants: string[];
  keyEvents: string[];
  context: {
    time: string;
    location: string;
    environmentalFactors: string;
    source: string;
  };
  reportRelevance: {
    legal: boolean;
    hr: boolean;
    safety: boolean;
    explanation: string;
    people?: string[];
  };
  videoUrl?: string;
  error?: string;
  user?: string;
  caseId?: string;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}
