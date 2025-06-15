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
  caseId: string;
  reportDate: string;
  summary: string;
  actionItems?: string[];
  keyEvents?: string[];
  detectedLanguage?: string;
  reportRelevance?: ReportRelevance;
  witnessInfo?: WitnessInfo;
  translatedTranscript?: string;
  originalTranscript?: string;
  language?: string;
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Critical';
  incidentDetails?: string;
  location?: string;
  environmentalFactors?: string;
  participants?: string[];
  timestampedLog?: string[];
  transcript?: string;
  videoUrl?: string; // URL to related video evidence
  publicUrl?: string; // Public URL for verification QR code
  lat?: number; // Latitude for location
  lng?: number; // Longitude for location
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
