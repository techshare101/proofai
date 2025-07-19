export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface PdfResult {
  pdfPath: string;
}

export interface WitnessInfo {
  name: string;
  title?: string;
  contact?: string;
  signature?: string;
}

export interface ReportRelevance {
  legal?: boolean;
  medical?: boolean;
  financial?: boolean;
}

export interface StructuredSummary {
  // Core identification
  caseId: string;
  case_id?: string; // Alternative case ID field
  summary?: string;
  
  // Transcript data
  transcript?: string;
  originalTranscript?: string;
  translatedTranscript?: string;
  rawTranscript?: string;
  transcriptText?: string; // Fallback transcript field
  
  // Location data
  location?: string;
  address?: string; // Alternative location field
  geocodedAddress?: string; // Geocoded address from coordinates
  lat?: number; // Latitude for location
  lng?: number; // Longitude for location
  
  // Timestamps
  timestamp?: string;
  reportDate?: string;
  
  // Media
  videoUrl?: string; // URL to related video evidence
  publicUrl?: string; // Public URL for verification QR code
  
  // Language
  language?: string;
  detectedLanguage?: string;
  
  // Additional metadata
  actionItems?: string[];
  keyEvents?: string[];
  incidentDetails?: string;
  environmentalFactors?: string;
  participants?: string[];
  timestampedLog?: string[];
  
  // Risk and relevance
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Critical';
  reportRelevance?: ReportRelevance;
  
  // Witness information
  witnessInfo?: WitnessInfo;
  
  // User information
  userId?: string;
  
  // Additional fields from API
  whisper?: {
    transcript?: string;
    text?: string;
  };
  
  // For backward compatibility
  [key: string]: any; // Allow additional properties
}

export interface PdfGenerationOptions {
  watermark?: boolean;
  confidential?: boolean;
  includeSignature?: boolean;
  includeTimestamps?: boolean;
  includeFooter?: boolean;
}

export interface PdfGenerationRequest extends StructuredSummary {
  originalTranscript: string;
  translatedTranscript?: string;
  language: string;
  options: PdfGenerationOptions;
}
